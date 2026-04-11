import PDFDocument from 'pdfkit';

// ═══════════════════════════════════════════════════════════
// PDF Report Generation Service (v2.0)
// Enhanced with Strengths, Weaknesses, Recommendations
// ═══════════════════════════════════════════════════════════

export function generateReport(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Urban Planning Report — UrbanPulse',
          Author: 'UrbanPulse System',
          Subject: 'Area Analysis Report',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const {
        areaName = 'Selected Area',
        center = {},
        analysis = {},
        places = [],
        timestamp = new Date().toISOString(),
      } = reportData;

      // ── Title Page ──
      doc.fontSize(28).fillColor('#0ea5e9').text('UrbanPulse', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(14).fillColor('#64748b').text('Urban Planning Analysis Report', { align: 'center' });
      doc.moveDown(1.5);

      // Decorative line
      doc.strokeColor('#0ea5e9').lineWidth(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // ── Report Info ──
      doc.fontSize(18).fillColor('#1e293b').text(`Area: ${areaName}`);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#64748b');
      doc.text(`Coordinates: ${center.lat?.toFixed(6) || 'N/A'}, ${center.lng?.toFixed(6) || 'N/A'}`);
      doc.text(`Generated: ${new Date(timestamp).toLocaleString()}`);
      doc.text(`Radius: ${analysis.radiusKm || 5} km`);
      doc.moveDown(1.5);

      // ── Overall Score ──
      const score = analysis.score ?? 0;
      const rating = analysis.rating || 'N/A';
      const scoreColor = score >= 80 ? '#22c55e' : score >= 65 ? '#3b82f6' : score >= 50 ? '#eab308' : score >= 35 ? '#f97316' : '#ef4444';

      doc.fontSize(14).fillColor('#1e293b').text('Overall Assessment', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(36).fillColor(scoreColor).text(`${score}/100`, { continued: true });
      doc.fontSize(16).fillColor('#475569').text(`  — ${rating}`);
      doc.moveDown(0.5);

      // Score breakdown
      if (analysis.scoring) {
        doc.fontSize(9).fillColor('#64748b');
        doc.text(`Road Connectivity: ${analysis.scoring.roadScore || 0}/100  |  Infrastructure Diversity: ${analysis.scoring.diversityScore || 0}/100`);
        if (analysis.scoring.penalties && analysis.scoring.penalties.length > 0) {
          doc.text(`Penalties applied: ${analysis.scoring.penalties.map((p) => p.reason).join('; ')}`);
        }
      }
      doc.moveDown(1);

      // ── Strengths ──
      if (analysis.strengths && analysis.strengths.length > 0) {
        doc.fontSize(14).fillColor('#22c55e').text('Strengths', { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(9).fillColor('#334155');
        analysis.strengths.forEach((s) => {
          doc.text(`  + ${s.message}`);
          doc.moveDown(0.15);
        });
        doc.moveDown(0.6);
      }

      // ── Weaknesses ──
      if (analysis.weaknesses && analysis.weaknesses.length > 0) {
        doc.fontSize(14).fillColor('#ef4444').text('Weaknesses', { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(9).fillColor('#334155');
        analysis.weaknesses.forEach((w) => {
          doc.text(`  - [${(w.severity || 'warning').toUpperCase()}] ${w.message}`);
          doc.moveDown(0.15);
        });
        doc.moveDown(0.6);
      }

      // ── Infrastructure Summary ──
      doc.fontSize(14).fillColor('#1e293b').text('Infrastructure Summary', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor('#334155');
      doc.text(`Total Places Found: ${analysis.totalPlaces || places.length || 0}`);
      doc.moveDown(0.3);

      if (analysis.coverage) {
        const coverageTypes = Object.keys(analysis.coverage);

        // Table header
        doc.font('Helvetica-Bold').fontSize(9);
        const tableTop = doc.y;
        doc.text('Type', 55, tableTop, { width: 90 });
        doc.text('Count', 150, tableTop, { width: 50 });
        doc.text('Nearest', 205, tableTop, { width: 60 });
        doc.text('Score', 270, tableTop, { width: 50 });
        doc.text('Status', 325, tableTop, { width: 80 });
        doc.moveDown(0.3);

        // Separator
        doc.strokeColor('#cbd5e1').lineWidth(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);

        doc.font('Helvetica').fontSize(9);
        coverageTypes.forEach((type) => {
          const cov = analysis.coverage[type];
          const statusColor = cov.status === 'excellent' ? '#22c55e' : cov.status === 'good' ? '#3b82f6' : cov.status === 'poor' ? '#f97316' : '#ef4444';

          const rowY = doc.y;
          doc.fillColor('#334155').text(type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '), 55, rowY, { width: 90 });
          doc.text(String(cov.count), 150, rowY, { width: 50 });
          doc.text(cov.nearest ? `${cov.nearest.toFixed(1)}km` : 'N/A', 205, rowY, { width: 60 });
          doc.text(cov.score !== undefined ? `${cov.score}` : '—', 270, rowY, { width: 50 });
          doc.fillColor(statusColor).text(cov.status || 'unknown', 325, rowY, { width: 80 });
          doc.moveDown(0.2);
        });
      }

      doc.moveDown(1);

      // ── Infrastructure Gaps ──
      if (analysis.gaps && analysis.gaps.length > 0) {
        doc.fontSize(14).fillColor('#1e293b').text('Identified Gaps', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(9).fillColor('#334155');
        analysis.gaps.forEach((gap, i) => {
          doc.text(`${i + 1}. [${gap.severity.toUpperCase()}] ${gap.message}`);
          doc.moveDown(0.2);
        });
        doc.moveDown(1);
      }

      // ── Recommendations ──
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        doc.fontSize(14).fillColor('#1e293b').text('Recommendations', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(9).fillColor('#334155');
        analysis.recommendations.forEach((rec, i) => {
          const priority = rec.priority || 'medium';
          const priorityLabel = priority === 'critical' ? '!!!' : priority === 'high' ? '!!' : priority === 'medium' ? '!' : '';
          doc.text(`${i + 1}. ${priorityLabel} ${rec.message}`);
          doc.moveDown(0.15);
        });
        doc.moveDown(1);
      } else {
        doc.fontSize(14).fillColor('#1e293b').text('Recommendations', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#334155');
        doc.text('• The area has good infrastructure coverage. Continue maintaining current facilities.');
        doc.moveDown(0.15);
        doc.text('• Monitor population growth to plan future facilities proactively.');
        doc.moveDown(1);
      }

      // ── Density Stats ──
      if (analysis.density) {
        doc.fontSize(14).fillColor('#1e293b').text('Density Analysis', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#334155');
        doc.text(`Infrastructure density: ${analysis.density.placesPerSqKm} facilities per km²`);
        doc.moveDown(1);
      }

      // ── Top Infrastructure ──
      if (places.length > 0) {
        doc.fontSize(14).fillColor('#1e293b').text('Nearby Infrastructure (Top 15)', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(9).fillColor('#334155');
        const topPlaces = places.slice(0, 15);
        topPlaces.forEach((p, i) => {
          doc.text(`${i + 1}. ${p.name} (${p.type}) — ${p.distance?.toFixed(1) || '?'}km away`);
          doc.moveDown(0.1);
        });
      }

      // ── Footer ──
      doc.moveDown(2);
      doc.strokeColor('#e2e8f0').lineWidth(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#94a3b8');
      doc.text('Generated by UrbanPulse — Urban Planning Intelligence Platform', { align: 'center' });
      doc.text('Data sourced from OpenStreetMap (© OpenStreetMap contributors)', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default { generateReport };
