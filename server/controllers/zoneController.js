import Zone from '../models/Zone.js';
import osmService from '../services/osmService.js';

// @desc    Get all zones (from MongoDB)
// @route   GET /api/zones
export const getZones = async (req, res, next) => {
  try {
    const { zone_type, status, source } = req.query;
    const filter = {};
    if (zone_type) filter.zone_type = zone_type;
    if (status) filter.status = status;
    if (source) filter.source = source;

    const zones = await Zone.find(filter).sort('name');
    res.json({ success: true, count: zones.length, data: zones });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single zone
// @route   GET /api/zones/:id
export const getZone = async (req, res, next) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch live admin boundaries from OSM
// @route   GET /api/zones/osm-fetch
export const fetchOSMZones = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide lat and lng' });
    }

    const boundaries = await osmService.getAdminBoundaries(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(radius)
    );

    // Check which ones are already saved in DB
    const osmIds = boundaries.map(b => b.osm_id).filter(Boolean);
    const existingZones = await Zone.find({ osm_id: { $in: osmIds } }).select('osm_id').lean();
    const savedOsmIds = new Set(existingZones.map(z => z.osm_id));

    const results = boundaries.map(b => ({
      ...b,
      alreadySaved: savedOsmIds.has(b.osm_id),
    }));

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Save an OSM zone to database (prevent duplicates via osm_id)
// @route   POST /api/zones/save-osm
export const saveOSMZone = async (req, res, next) => {
  try {
    const { osm_id, name, zone_type, geometry, center, area_sqkm, admin_level, description } = req.body;

    if (!osm_id || !geometry) {
      return res.status(400).json({ success: false, message: 'osm_id and geometry are required' });
    }

    // Check for duplicate
    const existing = await Zone.findOne({ osm_id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Zone "${existing.name}" (OSM ID: ${osm_id}) is already saved`,
        data: existing,
      });
    }

    // Map zone_type - ensure it matches our enum
    const validTypes = ['residential', 'commercial', 'industrial', 'green', 'institutional', 'mixed', 'administrative'];
    const finalType = validTypes.includes(zone_type) ? zone_type : 'administrative';

    const zone = await Zone.create({
      name: name || `Zone ${osm_id}`,
      zone_type: finalType,
      geometry,
      center: center || { lat: 0, lng: 0 },
      osm_id,
      admin_level: admin_level || null,
      source: 'osm',
      area_sqkm: area_sqkm || 0,
      description: description || '',
      status: 'active',
    });

    res.status(201).json({ success: true, data: zone });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Zone with this OSM ID already exists' });
    }
    next(error);
  }
};

// @desc    Create zone (manual)
// @route   POST /api/zones
export const createZone = async (req, res, next) => {
  try {
    const zone = await Zone.create({ ...req.body, source: 'manual' });
    res.status(201).json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

// @desc    Update zone
// @route   PUT /api/zones/:id
export const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete zone
// @route   DELETE /api/zones/:id
export const deleteZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.json({ success: true, message: 'Zone deleted' });
  } catch (error) {
    next(error);
  }
};
