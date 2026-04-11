import { evaluateLayout } from '../services/analysisService.js';
import { generateReport } from '../services/reportService.js';
import osmService from '../services/osmService.js';
import { analyzeArea } from '../services/analysisService.js';

// @desc    Evaluate a user-placed layout
// @route   POST /api/analysis/evaluate-layout
export const evaluateUserLayout = async (req, res, next) => {
  try {
    const { elements, centerLat, centerLng } = req.body;
    if (!elements || !Array.isArray(elements)) {
      return res.status(400).json({ success: false, message: 'Provide elements array' });
    }
    const result = evaluateLayout(elements, centerLat, centerLng);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate PDF urban planning report
// @route   POST /api/report/generate
export const generatePDFReport = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, areaName = 'Selected Area' } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide lat and lng' });
    }

    // Fetch places and analyze
    const places = await osmService.getNearbyAllTypes(parseFloat(lat), parseFloat(lng), parseInt(radius));
    const analysis = analyzeArea(places, parseFloat(lat), parseFloat(lng), parseInt(radius) / 1000);

    // Sanitize non-ASCII text for PDFKit (prevents crash on Arabic/Urdu fonts)
    const pdfSafeAreaName = areaName.replace(/[^\x00-\x7F]/g, '').trim() || 'Selected Area';
    const safePlaces = places.slice(0, 30).map(p => ({
      ...p,
      name: p.name ? p.name.replace(/[^\x00-\x7F]/g, '').trim() || 'Unnamed Facility' : 'Unnamed Facility'
    }));

    // Generate PDF
    const pdfBuffer = await generateReport({
      areaName: pdfSafeAreaName,
      center: { lat: parseFloat(lat), lng: parseFloat(lng) },
      analysis,
      places: safePlaces,
      timestamp: new Date().toISOString(),
    });

    const safeUrlName = encodeURIComponent(pdfSafeAreaName.replace(/\s+/g, '_'));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="UrbanPulse_Report_${safeUrlName}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
