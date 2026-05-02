import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// ─── Original Route imports ─────────────────────────────
import authRoutes from './routes/auth.js';
import zoneRoutes from './routes/zones.js';
import roadRoutes from './routes/roads.js';
import landmarkRoutes from './routes/landmarks.js';
import utilityRoutes from './routes/utilities.js';
import populationRoutes from './routes/population.js';
import spatialRoutes from './routes/spatial.js';
import analyticsRoutes from './routes/analytics.js';
import mapsRoutes from './routes/maps.js';
import reportRoutes from './routes/report.js';

// ─── New Route imports (Phase 2) ────────────────────────
import areasRoutes from './routes/areas.js';
import analytics2Routes from './routes/analytics2.js';
import plannerRoutes from './routes/planner.js';
import landmarks2Routes from './routes/landmarks2.js';
import notificationRoutes from './routes/notifications.js';
import projectRoutes from './routes/projects.js';
import comparisonRoutes from './routes/comparisons.js';

import mapLayerRoutes from './routes/mapLayers.js';
import activityRoutes from './routes/activity.js';
import cityRoutes from './routes/cities.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Connect to MongoDB
connectDB();

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Middleware
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://geo-spatial-database-for-urban-planning.onrender.com',
    'https://*.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Serve saved reports as static files
app.use('/api/reports/files', express.static(reportsDir));

// ─── Original API Routes ────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/roads', roadRoutes);
app.use('/api/landmarks', landmarkRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/population', populationRoutes);
app.use('/api/spatial', spatialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/report', reportRoutes);

// ─── New API Routes (18-collection system) ──────────────
app.use('/api/areas', areasRoutes);
app.use('/api/analytics2', analytics2Routes);
app.use('/api/planner', plannerRoutes);
app.use('/api/landmarks2', landmarks2Routes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/comparisons', comparisonRoutes);

app.use('/api/map-layers', mapLayerRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/cities', cityRoutes);

// Health check — enhanced for System Status page
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const dbState = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    const dbStateLabel = ['disconnected','connected','connecting','disconnecting'][dbState] || 'unknown';
    let lastActivity = null;
    try {
      const ActivityLog = (await import('./models/ActivityLog.js')).default;
      const latest = await ActivityLog.findOne().sort({ createdAt: -1 }).lean();
      if (latest) lastActivity = latest.createdAt || latest.created_at;
    } catch(e) { /* silent */ }
    res.json({
      success: true,
      message: 'UrbanPulse API is running',
      version: '2.1',
      uptime: process.uptime(),
      memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      db: { state: dbStateLabel, name: mongoose.connection.name || 'urbanpulse' },
      lastActivity,
      timestamp: new Date(),
    });
  } catch(err) {
    res.json({ success: true, message: 'UrbanPulse API is running', version: '2.1', timestamp: new Date() });
  }
});

// Admin stats endpoint — collection counts for System Status page
app.get('/api/admin/stats', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const collections = await mongoose.connection.db.listCollections().toArray();
    const counts = {};
    for (const col of collections) {
      counts[col.name] = await mongoose.connection.db.collection(col.name).countDocuments();
    }
    res.json({
      success: true,
      data: {
        counts,
        totalCollections: collections.length,
        dbName: mongoose.connection.db.databaseName,
        timestamp: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`UrbanPulse Server v2.1 running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
