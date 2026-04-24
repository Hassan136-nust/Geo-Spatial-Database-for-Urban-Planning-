import PlannerDesign from '../models/PlannerDesign.js';
import { evaluateLayout } from '../services/analysisService.js';
import { logActivity } from '../services/activityService.js';
import { notify } from '../services/notificationService.js';
import { generateCity } from '../services/cityGeneratorService.js';

// ─── City Generator ──────────────────────────────────────
// @desc    Generate a city layout (algorithmic by default, Gemini if key present)
// @route   POST /api/planner/ai-generate
export const aiGenerateCity = async (req, res, next) => {
  try {
    const {
      centerLat = 33.6844,
      centerLng = 73.0479,
      cityName = 'New City',
      population = 50000,
      houses = 10,
      hospitals = 2,
      schools = 3,
      parks = 3,
      mosques = 2,
      malls = 1,
      police = 1,
      industrial = 1,
      roads = 4,
      radiusKm = 5,
      additionalNotes = '',
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.length > 10;

    let elements = [];
    let engine = 'algorithmic';

    // ── Path A: Gemini AI (only if a real key is configured) ──
    if (hasValidKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are an expert urban planner AI. Generate a realistic city layout for "${cityName}" centered at lat ${centerLat}, lng ${centerLng}.

City: ${cityName} | Population: ~${population.toLocaleString()} | Radius: ${radiusKm} km
Elements needed: ${houses} houses, ${hospitals} hospitals, ${schools} schools, ${parks} parks, ${mosques} mosques, ${malls} malls, ${police} police stations, ${industrial} industrial zones, ${roads} road segments.
${additionalNotes ? `Extra notes: ${additionalNotes}` : ''}

Rules: hospitals/schools near houses; industrial at outer edges (≥${(radiusKm * 0.6).toFixed(1)}km from center); mosques/parks near residential; police near center.

Return ONLY a valid JSON array. No markdown, no explanation. Each item must have "type", "lat" (number), "lng" (number), "label" (string).
Valid types: house, hospital, school, park, mosque, mall, police, industrial, road.
Example: [{"type":"house","lat":${(centerLat + 0.01).toFixed(4)},"lng":${(centerLng + 0.01).toFixed(4)},"label":"Block A"}]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const validTypes = ['house', 'hospital', 'school', 'park', 'mosque', 'mall', 'police', 'industrial', 'road'];
          elements = parsed
            .filter((el) => el.type && validTypes.includes(el.type) && typeof el.lat === 'number' && typeof el.lng === 'number')
            .map((el) => ({
              id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: el.type,
              lat: parseFloat(el.lat.toFixed(6)),
              lng: parseFloat(el.lng.toFixed(6)),
              label: el.label || el.type,
              source: 'gemini',
            }));
          engine = 'gemini';
        }
      } catch (geminiErr) {
        // Gemini failed — fall through to algorithmic generator below
        console.warn('[City Generator] Gemini failed, falling back to algorithmic:', geminiErr.message);
      }
    }

    // ── Path B: Built-in algorithmic generator (always works) ──
    if (elements.length === 0) {
      elements = generateCity({
        centerLat, centerLng, cityName,
        houses, hospitals, schools, parks,
        mosques, malls, police, industrial,
        roads, radiusKm,
      });
      engine = 'algorithmic';
    }

    console.log(`[City Generator] Generated ${elements.length} elements for "${cityName}" via ${engine}`);

    res.json({
      success: true,
      data: {
        elements,
        cityName,
        center: { lat: centerLat, lng: centerLng },
        summary: `Generated ${elements.length} elements for ${cityName} (${engine})`,
        engine,
      },
    });
  } catch (error) {
    console.error('[City Generator] Fatal error:', error.message);
    next(error);
  }
};

// @desc    Save a planner design
// @route   POST /api/planner/save
export const saveDesign = async (req, res, next) => {
  try {
    const { design_name, elements, center, radius, designId } = req.body;

    if (!design_name) {
      return res.status(400).json({ success: false, message: 'Design name is required' });
    }
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one element is required' });
    }

    // Run evaluation
    const centerLat = center?.lat || elements.reduce((s, e) => s + e.lat, 0) / elements.length;
    const centerLng = center?.lng || elements.reduce((s, e) => s + e.lng, 0) / elements.length;
    const evaluation = evaluateLayout(elements, centerLat, centerLng, radius || 5);

    const designData = {
      user_id: req.user.id,
      design_name,
      center: { lat: centerLat, lng: centerLng },
      radius: radius || 5,
      elements: elements.map((e) => ({
        element_id: e.id || e.element_id || `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: e.type,
        lat: e.lat,
        lng: e.lng,
      })),
      evaluation_score: evaluation.score,
      evaluation_result: evaluation,
      element_count: elements.length,
    };

    let design;
    if (designId) {
      // Update existing
      design = await PlannerDesign.findOneAndUpdate(
        { _id: designId, user_id: req.user.id },
        { $set: designData },
        { new: true, runValidators: true }
      );
      if (!design) {
        return res.status(404).json({ success: false, message: 'Design not found' });
      }
      logActivity(req.user.id, 'update_design', 'design', design._id, { name: design_name }, req);
    } else {
      // Create new
      design = await PlannerDesign.create(designData);
      logActivity(req.user.id, 'save_design', 'design', design._id, { name: design_name }, req);
      notify(req.user.id, 'Design Saved 📐', `"${design_name}" scored ${evaluation.score}/100`, {
        type: 'success',
        category: 'design_saved',
        link: '/my-designs',
        resourceId: design._id,
      });
    }

    res.status(designId ? 200 : 201).json({
      success: true,
      data: design,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all designs for current user
// @route   GET /api/planner/user-designs
export const getUserDesigns = async (req, res, next) => {
  try {
    const designs = await PlannerDesign.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .select('-evaluation_result')
      .lean();

    res.json({ success: true, count: designs.length, data: designs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single design
// @route   GET /api/planner/:id
export const getDesign = async (req, res, next) => {
  try {
    const design = await PlannerDesign.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
    res.json({ success: true, data: design });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a design
// @route   PUT /api/planner/:id
export const updateDesign = async (req, res, next) => {
  try {
    const { design_name, elements, radius, feedback } = req.body;
    const updateData = {};

    if (design_name) updateData.design_name = design_name;
    if (feedback) updateData.feedback = feedback;
    if (radius) updateData.radius = radius;

    if (elements && Array.isArray(elements)) {
      updateData.elements = elements.map((e) => ({
        element_id: e.id || e.element_id,
        type: e.type,
        lat: e.lat,
        lng: e.lng,
      }));
      updateData.element_count = elements.length;

      // Re-evaluate
      const centerLat = elements.reduce((s, e) => s + e.lat, 0) / elements.length;
      const centerLng = elements.reduce((s, e) => s + e.lng, 0) / elements.length;
      
      const existingDesign = await PlannerDesign.findOne({ _id: req.params.id, user_id: req.user.id });
      const evalRadius = radius || existingDesign?.radius || 5;
      
      const evaluation = evaluateLayout(elements, centerLat, centerLng, evalRadius);
      updateData.evaluation_score = evaluation.score;
      updateData.evaluation_result = evaluation;
      updateData.center = { lat: centerLat, lng: centerLng };
    }

    const design = await PlannerDesign.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    logActivity(req.user.id, 'update_design', 'design', design._id, {}, req);

    res.json({ success: true, data: design });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a design
// @route   DELETE /api/planner/:id
export const deleteDesign = async (req, res, next) => {
  try {
    const design = await PlannerDesign.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    logActivity(req.user.id, 'delete_design', 'design', design._id, {}, req);

    res.json({ success: true, message: 'Design deleted' });
  } catch (error) {
    next(error);
  }
};
