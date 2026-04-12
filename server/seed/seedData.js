import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urbanpulse';

// ═══════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════
async function seedDatabase() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (only if strictly necessary for demo purposes, here we only touch users)
    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared users collection');

    // Seed Users
    console.log('👤 Seeding users...');
    const users = await User.create([
      { name: 'Admin User', email: 'admin@urbanpulse.pk', password: 'admin123', role: 'admin' },
      { name: 'Planner User', email: 'planner@urbanpulse.pk', password: 'planner123', role: 'planner' },
      { name: 'Viewer User', email: 'viewer@urbanpulse.pk', password: 'viewer123', role: 'viewer' },
    ]);
    console.log(`✅ Created ${users.length} users`);

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Users:      ${users.length}`);
    console.log('═══════════════════════════════════════════════');
    console.log('📝 Note: The MERN dynamic engine now fetches, caches,');
    console.log('         and dynamically saves map data from OpenStreetMap.');
    console.log('         Legacy static mock records are removed.');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('🔑 Default Login Credentials:');
    console.log('   Admin:   admin@urbanpulse.pk / admin123');
    console.log('   Planner: planner@urbanpulse.pk / planner123');
    console.log('   Viewer:  viewer@urbanpulse.pk / viewer123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
}

seedDatabase();
