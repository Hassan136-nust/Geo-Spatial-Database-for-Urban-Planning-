import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
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

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'UrbanPulse API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 UrbanPulse Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
