import { evaluateLayout } from '../services/analysisService.js';
import { generateReport } from '../services/reportService.js';
import osmService from '../services/osmService.js';
import { analyzeArea } from '../services/analysisService.js';
import Report from '../models/Report.js';
import { logActivity } from '../services/activityService.js';
import { notify } from '../services/notificationService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Evaluate a user-placed layout
// @route   POST /api/analysis/evaluate-layout
export const evaluateUserLayout = async (req, res, next) => {
  try {
    const { elements, centerLat, centerLng, radius = 5 } = req.body;
    if (!elements || !Array.isArray(elements)) {
      return res.status(400).json({ success: false, message: 'Provide elements array' });
    }
    const result = evaluateLayout(elements, centerLat, centerLng, Number(radius));
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

    // Fetch places, roads, and analyze
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseInt(radius);

    const [places, roadData] = await Promise.all([
      osmService.getNearbyAllTypes(parsedLat, parsedLng, parsedRadius),
      osmService.getRoads(parsedLat, parsedLng, Math.min(parsedRadius, 3000))
    ]);
    const analysis = analyzeArea(places, parsedLat, parsedLng, parsedRadius / 1000, roadData.length);

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

    // Save PDF to disk and DB if user is authenticated
    if (req.user) {
      try {
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        const fileName = `report_${req.user.id}_${Date.now()}.pdf`;
        const filePath = path.join(reportsDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        const report = await Report.create({
          user_id: req.user.id,
          area_name: pdfSafeAreaName,
          center: { lat: parseFloat(lat), lng: parseFloat(lng) },
          radius: parseInt(radius),
          score: analysis.score || 0,
          rating: analysis.rating || '',
          pdf_path: fileName,
          file_size: pdfBuffer.length,
          report_type: 'area_analysis',
        });

        logActivity(req.user.id, 'generate_report', 'report', report._id, { areaName: pdfSafeAreaName }, req);
        notify(req.user.id, 'Report Ready 📄', `PDF report for "${pdfSafeAreaName}" is ready to download`, {
          type: 'success',
          category: 'report_ready',
          link: '/saved-reports',
          resourceId: report._id,
        });
      } catch (saveErr) {
        console.error('[Report] Save error (non-fatal):', saveErr.message);
      }
    }

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

// @desc    Get user's report history
// @route   GET /api/report/history
export const getUserReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ user_id: req.user.id })
      .sort({ generated_at: -1 })
      .lean();
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Download a saved report
// @route   GET /api/report/:id/download
export const downloadReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const filePath = path.join(__dirname, '..', 'reports', report.pdf_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found on disk' });
    }

    logActivity(req.user.id, 'download_report', 'report', report._id, {}, req);

    const safeUrlName = encodeURIComponent(report.area_name.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '_'));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="UrbanPulse_Report_${safeUrlName}.pdf"`,
    });
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved report
// @route   DELETE /api/report/:id
export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'reports', report.pdf_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    next(error);
  }
};
