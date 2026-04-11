import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Zone from '../models/Zone.js';
import Road from '../models/Road.js';
import Landmark from '../models/Landmark.js';
import Utility from '../models/Utility.js';
import PopulationData from '../models/PopulationData.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urbanpulse';

// ═══════════════════════════════════════════════════════════
// ISLAMABAD ZONES — GeoJSON Polygons with real coordinates
// ═══════════════════════════════════════════════════════════
const zonesData = [
  {
    name: 'F-6 Markaz',
    zone_type: 'commercial',
    geometry: { type: 'Polygon', coordinates: [[[73.0280, 73.0280 && 73.0280, 33.7270], [73.0370, 33.7270], [73.0370, 33.7330], [73.0280, 33.7330], [73.0280, 33.7270]]] },
    population_density: 8500,
    zoning_code: 'COM-F6',
    land_use_type: 'Commercial Hub',
    area_sqkm: 1.2,
    description: 'Major commercial center in Islamabad with markets, restaurants, and offices',
    status: 'active',
    color: '#FF6B6B',
  },
  {
    name: 'F-7 Markaz',
    zone_type: 'commercial',
    geometry: { type: 'Polygon', coordinates: [[[73.0350, 33.7180], [73.0440, 33.7180], [73.0440, 33.7240], [73.0350, 33.7240], [73.0350, 33.7180]]] },
    population_density: 7200,
    zoning_code: 'COM-F7',
    land_use_type: 'Commercial & Retail',
    area_sqkm: 1.4,
    description: 'Upscale commercial area with Jinnah Super Market and surrounding businesses',
    status: 'active',
    color: '#4ECDC4',
  },
  {
    name: 'F-8',
    zone_type: 'residential',
    geometry: { type: 'Polygon', coordinates: [[[73.0230, 33.7080], [73.0380, 33.7080], [73.0380, 33.7170], [73.0230, 33.7170], [73.0230, 33.7080]]] },
    population_density: 5800,
    zoning_code: 'RES-F8',
    land_use_type: 'Residential',
    area_sqkm: 2.1,
    description: 'Well-planned residential sector with parks and community facilities',
    status: 'active',
    color: '#45B7D1',
  },
  {
    name: 'G-6',
    zone_type: 'institutional',
    geometry: { type: 'Polygon', coordinates: [[[73.0480, 33.7080], [73.0600, 33.7080], [73.0600, 33.7160], [73.0480, 33.7160], [73.0480, 33.7080]]] },
    population_density: 3200,
    zoning_code: 'INS-G6',
    land_use_type: 'Government & Institutional',
    area_sqkm: 1.8,
    description: 'Government offices and institutional buildings including ministries',
    status: 'active',
    color: '#96CEB4',
  },
  {
    name: 'G-8',
    zone_type: 'mixed',
    geometry: { type: 'Polygon', coordinates: [[[73.0280, 33.6900], [73.0420, 33.6900], [73.0420, 33.6990], [73.0280, 33.6990], [73.0280, 33.6900]]] },
    population_density: 9200,
    zoning_code: 'MIX-G8',
    land_use_type: 'Mixed Use',
    area_sqkm: 2.0,
    description: 'Densely populated mixed-use sector with G-8 Markaz commercial area',
    status: 'active',
    color: '#FFEAA7',
  },
  {
    name: 'G-9',
    zone_type: 'mixed',
    geometry: { type: 'Polygon', coordinates: [[[73.0140, 33.6830], [73.0280, 33.6830], [73.0280, 33.6920], [73.0140, 33.6920], [73.0140, 33.6830]]] },
    population_density: 10500,
    zoning_code: 'MIX-G9',
    land_use_type: 'Mixed Use Dense',
    area_sqkm: 1.9,
    description: 'One of the most populated sectors with vibrant markets and residential areas',
    status: 'active',
    color: '#DDA0DD',
  },
  {
    name: 'G-10',
    zone_type: 'residential',
    geometry: { type: 'Polygon', coordinates: [[[73.0030, 33.6760], [73.0170, 33.6760], [73.0170, 33.6850], [73.0030, 33.6850], [73.0030, 33.6760]]] },
    population_density: 7800,
    zoning_code: 'RES-G10',
    land_use_type: 'Residential',
    area_sqkm: 2.2,
    description: 'Large residential sector with G-10 Markaz and educational institutions',
    status: 'active',
    color: '#87CEEB',
  },
  {
    name: 'G-11',
    zone_type: 'residential',
    geometry: { type: 'Polygon', coordinates: [[[72.9900, 33.6690], [73.0050, 33.6690], [73.0050, 33.6780], [72.9900, 33.6780], [72.9900, 33.6690]]] },
    population_density: 8900,
    zoning_code: 'RES-G11',
    land_use_type: 'Residential',
    area_sqkm: 2.0,
    description: 'Growing residential area with planned commercial development',
    status: 'active',
    color: '#98D8C8',
  },
  {
    name: 'I-8',
    zone_type: 'mixed',
    geometry: { type: 'Polygon', coordinates: [[[73.0350, 33.6620], [73.0500, 33.6620], [73.0500, 33.6720], [73.0350, 33.6720], [73.0350, 33.6620]]] },
    population_density: 6500,
    zoning_code: 'MIX-I8',
    land_use_type: 'Mixed Use',
    area_sqkm: 2.3,
    description: 'Developing sector near NUST with residential and commercial zones',
    status: 'active',
    color: '#F7DC6F',
  },
  {
    name: 'I-9',
    zone_type: 'industrial',
    geometry: { type: 'Polygon', coordinates: [[[73.0150, 33.6530], [73.0320, 33.6530], [73.0320, 33.6630], [73.0150, 33.6630], [73.0150, 33.6530]]] },
    population_density: 2100,
    zoning_code: 'IND-I9',
    land_use_type: 'Industrial',
    area_sqkm: 3.0,
    description: 'Major industrial area with factories, warehouses, and workshops',
    status: 'active',
    color: '#E74C3C',
  },
  {
    name: 'I-10',
    zone_type: 'mixed',
    geometry: { type: 'Polygon', coordinates: [[[73.0020, 33.6450], [73.0180, 33.6450], [73.0180, 33.6550], [73.0020, 33.6550], [73.0020, 33.6450]]] },
    population_density: 5500,
    zoning_code: 'MIX-I10',
    land_use_type: 'Mixed Use',
    area_sqkm: 2.5,
    description: 'Rapidly developing sector with new residential projects and commercial centers',
    status: 'under_development',
    color: '#3498DB',
  },
  {
    name: 'Blue Area',
    zone_type: 'commercial',
    geometry: { type: 'Polygon', coordinates: [[[73.0450, 33.7060], [73.0620, 33.7060], [73.0620, 33.7130], [73.0450, 33.7130], [73.0450, 33.7060]]] },
    population_density: 1200,
    zoning_code: 'CBD-BA',
    land_use_type: 'Central Business District',
    area_sqkm: 1.6,
    description: 'Islamabad\'s central business district with high-rise offices, banks, and corporate HQs',
    status: 'active',
    color: '#2980B9',
  },
  {
    name: 'H-8',
    zone_type: 'institutional',
    geometry: { type: 'Polygon', coordinates: [[[73.0350, 33.6810], [73.0490, 33.6810], [73.0490, 33.6900], [73.0350, 33.6900], [73.0350, 33.6810]]] },
    population_density: 2800,
    zoning_code: 'INS-H8',
    land_use_type: 'Institutional',
    area_sqkm: 1.9,
    description: 'Home to Quaid-i-Azam University and research institutions',
    status: 'active',
    color: '#1ABC9C',
  },
  {
    name: 'E-7',
    zone_type: 'residential',
    geometry: { type: 'Polygon', coordinates: [[[73.0350, 33.7340], [73.0480, 33.7340], [73.0480, 33.7420], [73.0350, 33.7420], [73.0350, 33.7340]]] },
    population_density: 4200,
    zoning_code: 'RES-E7',
    land_use_type: 'Low Density Residential',
    area_sqkm: 1.5,
    description: 'Premium low-density residential area near Margalla Hills',
    status: 'active',
    color: '#27AE60',
  },
  {
    name: 'E-11',
    zone_type: 'residential',
    geometry: { type: 'Polygon', coordinates: [[[72.9950, 33.7340], [73.0100, 33.7340], [73.0100, 33.7420], [72.9950, 33.7420], [72.9950, 33.7340]]] },
    population_density: 6200,
    zoning_code: 'RES-E11',
    land_use_type: 'Residential Development',
    area_sqkm: 1.8,
    description: 'Newly developed residential sector with modern housing projects',
    status: 'under_development',
    color: '#8E44AD',
  },
  {
    name: 'Bahria Town Phase 1-7',
    zone_type: 'residential',
    geometry: { type: 'Polygon', coordinates: [[[73.0700, 33.5100], [73.1100, 33.5100], [73.1100, 33.5400], [73.0700, 33.5400], [73.0700, 33.5100]]] },
    population_density: 4800,
    zoning_code: 'PVT-BTP',
    land_use_type: 'Private Housing',
    area_sqkm: 12.0,
    description: 'Large private housing society with gated community, parks, and commercial areas',
    status: 'active',
    color: '#E67E22',
  },
  {
    name: 'DHA Phase II',
    zone_type: 'residential',
    geometry: { type: 'Polygon', coordinates: [[[73.0900, 33.5300], [73.1250, 33.5300], [73.1250, 33.5550], [73.0900, 33.5550], [73.0900, 33.5300]]] },
    population_density: 3500,
    zoning_code: 'PVT-DHA',
    land_use_type: 'Defence Housing',
    area_sqkm: 8.5,
    description: 'Defence Housing Authority with planned residential and commercial areas',
    status: 'under_development',
    color: '#D35400',
  },
];

// Fix the zones data geometry (the first entry had a bug)
zonesData[0].geometry = { type: 'Polygon', coordinates: [[[73.0280, 33.7270], [73.0370, 33.7270], [73.0370, 33.7330], [73.0280, 33.7330], [73.0280, 33.7270]]] };

// ═══════════════════════════════════════════════════════════
// ISLAMABAD ROADS — GeoJSON LineStrings
// ═══════════════════════════════════════════════════════════
const roadsData = [
  {
    name: 'Kashmir Highway',
    road_type: 'highway',
    geometry: { type: 'LineString', coordinates: [[72.9800, 33.6900], [73.0000, 33.6800], [73.0200, 33.6700], [73.0450, 33.6600], [73.0700, 33.6500]] },
    length_km: 18.5,
    traffic_capacity: 45000,
    lanes: 6,
    status: 'operational',
    speed_limit: 100,
    surface_type: 'asphalt',
  },
  {
    name: 'Islamabad Expressway',
    road_type: 'expressway',
    geometry: { type: 'LineString', coordinates: [[73.0800, 33.7400], [73.0780, 33.7200], [73.0750, 33.7000], [73.0720, 33.6800], [73.0700, 33.6500], [73.0680, 33.6200]] },
    length_km: 25.0,
    traffic_capacity: 60000,
    lanes: 8,
    status: 'operational',
    speed_limit: 120,
    surface_type: 'asphalt',
  },
  {
    name: 'Faisal Avenue',
    road_type: 'arterial',
    geometry: { type: 'LineString', coordinates: [[73.0100, 33.7100], [73.0300, 33.7100], [73.0500, 33.7100], [73.0650, 33.7100], [73.0800, 33.7100]] },
    length_km: 8.2,
    traffic_capacity: 30000,
    lanes: 6,
    status: 'operational',
    speed_limit: 60,
    surface_type: 'asphalt',
  },
  {
    name: 'Margalla Road',
    road_type: 'arterial',
    geometry: { type: 'LineString', coordinates: [[73.0150, 33.7350], [73.0300, 33.7380], [73.0500, 33.7400], [73.0650, 33.7420], [73.0800, 33.7450]] },
    length_km: 7.5,
    traffic_capacity: 20000,
    lanes: 4,
    status: 'operational',
    speed_limit: 50,
    surface_type: 'asphalt',
  },
  {
    name: 'Jinnah Avenue',
    road_type: 'arterial',
    geometry: { type: 'LineString', coordinates: [[73.0400, 33.6900], [73.0500, 33.7000], [73.0550, 33.7100], [73.0600, 33.7200], [73.0650, 33.7300]] },
    length_km: 5.8,
    traffic_capacity: 25000,
    lanes: 6,
    status: 'operational',
    speed_limit: 60,
    surface_type: 'asphalt',
  },
  {
    name: 'Constitution Avenue',
    road_type: 'arterial',
    geometry: { type: 'LineString', coordinates: [[73.0700, 33.6950], [73.0750, 33.7050], [73.0800, 33.7150], [73.0850, 33.7250], [73.0900, 33.7350]] },
    length_km: 4.5,
    traffic_capacity: 22000,
    lanes: 4,
    status: 'operational',
    speed_limit: 60,
    surface_type: 'asphalt',
  },
  {
    name: '7th Avenue',
    road_type: 'arterial',
    geometry: { type: 'LineString', coordinates: [[73.0450, 33.6700], [73.0450, 33.6850], [73.0450, 33.7000], [73.0450, 33.7150], [73.0450, 33.7300]] },
    length_km: 7.0,
    traffic_capacity: 28000,
    lanes: 6,
    status: 'operational',
    speed_limit: 60,
    surface_type: 'asphalt',
  },
  {
    name: '9th Avenue',
    road_type: 'arterial',
    geometry: { type: 'LineString', coordinates: [[73.0300, 33.6700], [73.0300, 33.6850], [73.0300, 33.7000], [73.0300, 33.7150], [73.0300, 33.7300]] },
    length_km: 6.8,
    traffic_capacity: 26000,
    lanes: 4,
    status: 'operational',
    speed_limit: 60,
    surface_type: 'asphalt',
  },
  {
    name: 'Srinagar Highway (Renamed Kashmir Highway Extension)',
    road_type: 'highway',
    geometry: { type: 'LineString', coordinates: [[72.9200, 33.6950], [72.9500, 33.6950], [72.9800, 33.6900], [73.0100, 33.6850]] },
    length_km: 12.0,
    traffic_capacity: 50000,
    lanes: 8,
    status: 'operational',
    speed_limit: 100,
    surface_type: 'asphalt',
  },
  {
    name: 'IJP Road',
    road_type: 'highway',
    geometry: { type: 'LineString', coordinates: [[72.9800, 33.6200], [73.0000, 33.6250], [73.0200, 33.6300], [73.0500, 33.6350], [73.0800, 33.6400]] },
    length_km: 15.0,
    traffic_capacity: 40000,
    lanes: 6,
    status: 'operational',
    speed_limit: 80,
    surface_type: 'asphalt',
  },
  {
    name: 'Khayaban-e-Iqbal',
    road_type: 'collector',
    geometry: { type: 'LineString', coordinates: [[73.0350, 33.7180], [73.0350, 33.7100], [73.0350, 33.7020], [73.0350, 33.6940]] },
    length_km: 3.0,
    traffic_capacity: 15000,
    lanes: 4,
    status: 'operational',
    speed_limit: 50,
    surface_type: 'asphalt',
  },
  {
    name: 'Khayaban-e-Suharwardy',
    road_type: 'arterial',
    geometry: { type: 'LineString', coordinates: [[73.0550, 33.7300], [73.0600, 33.7200], [73.0650, 33.7100], [73.0700, 33.7000]] },
    length_km: 3.8,
    traffic_capacity: 20000,
    lanes: 4,
    status: 'operational',
    speed_limit: 50,
    surface_type: 'asphalt',
  },
  {
    name: 'Ataturk Avenue',
    road_type: 'arterial',
    geometry: { type: 'LineString', coordinates: [[73.0500, 33.6850], [73.0550, 33.6950], [73.0580, 33.7050], [73.0600, 33.7150]] },
    length_km: 3.5,
    traffic_capacity: 18000,
    lanes: 4,
    status: 'operational',
    speed_limit: 50,
    surface_type: 'asphalt',
  },
  {
    name: 'Murree Road (Islamabad Section)',
    road_type: 'highway',
    geometry: { type: 'LineString', coordinates: [[73.0800, 33.6600], [73.1000, 33.6700], [73.1200, 33.6800], [73.1400, 33.6900]] },
    length_km: 8.0,
    traffic_capacity: 35000,
    lanes: 4,
    status: 'operational',
    speed_limit: 80,
    surface_type: 'asphalt',
  },
  {
    name: 'Park Road',
    road_type: 'collector',
    geometry: { type: 'LineString', coordinates: [[73.0700, 33.6800], [73.0750, 33.6900], [73.0780, 33.7000], [73.0790, 33.7100]] },
    length_km: 4.0,
    traffic_capacity: 12000,
    lanes: 2,
    status: 'operational',
    speed_limit: 40,
    surface_type: 'asphalt',
  },
];

// ═══════════════════════════════════════════════════════════
// ISLAMABAD LANDMARKS — GeoJSON Points
// ═══════════════════════════════════════════════════════════
const landmarksData = [
  // Hospitals
  { name: 'PIMS (Pakistan Institute of Medical Sciences)', type: 'hospital', subtype: 'General Hospital', geometry: { type: 'Point', coordinates: [73.0494, 33.7050] }, service_radius_km: 5, capacity: 1200, status: 'operational', address: 'G-8, Islamabad', description: 'Largest public hospital in Islamabad providing tertiary care', rating: 4.0 },
  { name: 'Shifa International Hospital', type: 'hospital', subtype: 'Private Hospital', geometry: { type: 'Point', coordinates: [73.0400, 33.7150] }, service_radius_km: 8, capacity: 550, status: 'operational', address: 'H-8/4, Islamabad', description: 'Premier private hospital with international accreditation', rating: 4.5 },
  { name: 'Ali Medical Centre', type: 'hospital', subtype: 'Private Hospital', geometry: { type: 'Point', coordinates: [73.0480, 33.6900] }, service_radius_km: 4, capacity: 200, status: 'operational', address: 'G-8 Markaz, Islamabad', description: 'Specialized medical center with modern facilities', rating: 3.8 },
  { name: 'Polyclinic Hospital', type: 'hospital', subtype: 'Government Hospital', geometry: { type: 'Point', coordinates: [73.0550, 33.7100] }, service_radius_km: 5, capacity: 700, status: 'operational', address: 'G-6, Islamabad', description: 'Federal Government Polyclinic providing multi-specialty care', rating: 3.5 },
  { name: 'Islamabad Diagnostic Centre', type: 'hospital', subtype: 'Diagnostic Center', geometry: { type: 'Point', coordinates: [73.0380, 33.7200] }, service_radius_km: 6, capacity: 150, status: 'operational', address: 'F-8 Markaz, Islamabad', description: 'Advanced diagnostic and laboratory services', rating: 4.2 },
  { name: 'Capital Hospital (CDA Hospital)', type: 'hospital', subtype: 'Government Hospital', geometry: { type: 'Point', coordinates: [73.0600, 33.6950] }, service_radius_km: 4, capacity: 400, status: 'operational', address: 'G-6/2, Islamabad', description: 'CDA-operated hospital serving government employees', rating: 3.6 },

  // Universities
  { name: 'NUST (National University of Sciences & Technology)', type: 'university', subtype: 'Engineering University', geometry: { type: 'Point', coordinates: [73.0765, 33.6425] }, service_radius_km: 3, capacity: 15000, status: 'operational', address: 'H-12, Islamabad', description: 'Top-ranked engineering and technology university in Pakistan', rating: 4.7 },
  { name: 'COMSATS University Islamabad', type: 'university', subtype: 'Technology University', geometry: { type: 'Point', coordinates: [73.0388, 33.6775] }, service_radius_km: 3, capacity: 12000, status: 'operational', address: 'Park Road, Chak Shahzad', description: 'Leading IT and engineering university', rating: 4.3 },
  { name: 'Quaid-i-Azam University', type: 'university', subtype: 'Research University', geometry: { type: 'Point', coordinates: [73.1371, 33.7480] }, service_radius_km: 3, capacity: 10000, status: 'operational', address: 'University Road, Islamabad', description: 'Premier research university of Pakistan', rating: 4.5 },
  { name: 'International Islamic University', type: 'university', subtype: 'Islamic University', geometry: { type: 'Point', coordinates: [73.0200, 33.6600] }, service_radius_km: 3, capacity: 20000, status: 'operational', address: 'H-10, Islamabad', description: 'Major Islamic university with diverse faculties', rating: 4.0 },
  { name: 'Air University', type: 'university', subtype: 'Aerospace University', geometry: { type: 'Point', coordinates: [73.0100, 33.6120] }, service_radius_km: 2, capacity: 5000, status: 'operational', address: 'E-9, PAF Complex', description: 'PAF-affiliated university for aerospace and engineering', rating: 4.1 },
  { name: 'Bahria University Islamabad', type: 'university', subtype: 'General University', geometry: { type: 'Point', coordinates: [73.0500, 33.6700] }, service_radius_km: 2, capacity: 8000, status: 'operational', address: 'Shangrila Road, E-8', description: 'Navy-affiliated university with engineering and management programs', rating: 4.0 },

  // Schools
  { name: 'Islamabad Model College F-6', type: 'school', subtype: 'Government School', geometry: { type: 'Point', coordinates: [73.0320, 33.7300] }, service_radius_km: 2, capacity: 1500, status: 'operational', address: 'F-6/1, Islamabad', description: 'Federal government model school', rating: 3.8 },
  { name: 'Islamabad College for Girls F-6', type: 'school', subtype: 'Girls College', geometry: { type: 'Point', coordinates: [73.0340, 33.7280] }, service_radius_km: 2, capacity: 2000, status: 'operational', address: 'F-6/2, Islamabad', description: 'Premier government girls college', rating: 3.9 },
  { name: 'Roots Millennium School I-8', type: 'school', subtype: 'Private School', geometry: { type: 'Point', coordinates: [73.0420, 33.6670] }, service_radius_km: 3, capacity: 3000, status: 'operational', address: 'I-8, Islamabad', description: 'International private school chain', rating: 4.4 },

  // Parks
  { name: 'F-9 Park (Fatima Jinnah Park)', type: 'park', subtype: 'Urban Park', geometry: { type: 'Point', coordinates: [73.0200, 33.7050] }, service_radius_km: 4, capacity: 50000, status: 'operational', address: 'Between F-8 and F-9', description: 'Largest public park in Islamabad spanning 750 acres', rating: 4.3 },
  { name: 'Margalla Hills National Park', type: 'park', subtype: 'National Park', geometry: { type: 'Point', coordinates: [73.0500, 33.7600] }, service_radius_km: 10, capacity: 100000, status: 'operational', address: 'Northern Islamabad', description: 'Protected national park with hiking trails and wildlife', rating: 4.8 },
  { name: 'Daman-e-Koh', type: 'park', subtype: 'Viewpoint', geometry: { type: 'Point', coordinates: [73.0580, 33.7500] }, service_radius_km: 5, capacity: 5000, status: 'operational', address: 'Margalla Hills', description: 'Hilltop garden and viewpoint overlooking Islamabad', rating: 4.6 },
  { name: 'Rose and Jasmine Garden', type: 'park', subtype: 'Garden', geometry: { type: 'Point', coordinates: [73.0850, 33.7300] }, service_radius_km: 2, capacity: 3000, status: 'operational', address: 'Near Rawal Lake', description: 'Beautiful themed garden with rose and jasmine varieties', rating: 4.4 },
  { name: 'Lake View Park', type: 'park', subtype: 'Recreational', geometry: { type: 'Point', coordinates: [73.1100, 33.7150] }, service_radius_km: 3, capacity: 10000, status: 'operational', address: 'Near Rawal Lake', description: 'Family recreation park near Rawal Lake', rating: 4.2 },
  { name: 'Shakarparian Park', type: 'park', subtype: 'National Heritage', geometry: { type: 'Point', coordinates: [73.0680, 33.6950] }, service_radius_km: 3, capacity: 8000, status: 'operational', address: 'Shakarparian Hills', description: 'Heritage park with panoramic views and cultural exhibits', rating: 4.1 },

  // Government Buildings
  { name: 'Parliament House', type: 'government', subtype: 'Legislature', geometry: { type: 'Point', coordinates: [73.0867, 33.7290] }, service_radius_km: 1, capacity: 500, status: 'operational', address: 'Constitution Avenue', description: 'National Assembly and Senate of Pakistan', rating: 4.5 },
  { name: 'Supreme Court of Pakistan', type: 'government', subtype: 'Judiciary', geometry: { type: 'Point', coordinates: [73.0928, 33.7285] }, service_radius_km: 1, capacity: 200, status: 'operational', address: 'Constitution Avenue', description: 'Highest court of Pakistan', rating: 4.6 },
  { name: 'Presidency (Aiwan-e-Sadr)', type: 'government', subtype: 'Executive', geometry: { type: 'Point', coordinates: [73.0801, 33.7297] }, service_radius_km: 1, capacity: 100, status: 'operational', address: 'Constitution Avenue', description: 'Official residence of the President of Pakistan', rating: 4.7 },
  { name: 'Prime Minister House', type: 'government', subtype: 'Executive', geometry: { type: 'Point', coordinates: [73.0750, 33.7310] }, service_radius_km: 1, capacity: 100, status: 'operational', address: 'Constitution Avenue', description: 'Official residence of the Prime Minister of Pakistan', rating: 4.6 },
  { name: 'Secretariat (Government Offices)', type: 'government', subtype: 'Administrative', geometry: { type: 'Point', coordinates: [73.0550, 33.7120] }, service_radius_km: 2, capacity: 5000, status: 'operational', address: 'G-6, Islamabad', description: 'Central government administrative offices complex', rating: 3.5 },

  // Religious
  { name: 'Faisal Mosque', type: 'religious', subtype: 'Mosque', geometry: { type: 'Point', coordinates: [73.0372, 33.7295] }, service_radius_km: 5, capacity: 100000, status: 'operational', address: 'Shah Faisal Avenue', description: 'Iconic national mosque of Pakistan, one of the largest in the world', rating: 4.9 },
  { name: 'Lal Masjid (Red Mosque)', type: 'religious', subtype: 'Mosque', geometry: { type: 'Point', coordinates: [73.0530, 33.7100] }, service_radius_km: 2, capacity: 10000, status: 'operational', address: 'G-6, Islamabad', description: 'Historic mosque in the center of Islamabad', rating: 4.0 },

  // Commercial
  { name: 'Centaurus Mall', type: 'commercial', subtype: 'Shopping Mall', geometry: { type: 'Point', coordinates: [73.0550, 33.7090] }, service_radius_km: 5, capacity: 15000, status: 'operational', address: 'F-8, Jinnah Avenue', description: 'Premier luxury shopping mall and mixed-use development', rating: 4.3 },
  { name: 'Giga Mall DHA', type: 'commercial', subtype: 'Shopping Mall', geometry: { type: 'Point', coordinates: [73.0300, 33.5350] }, service_radius_km: 4, capacity: 10000, status: 'operational', address: 'GT Road, DHA Phase II', description: 'Major shopping and entertainment complex', rating: 4.1 },
  { name: 'Safa Gold Mall', type: 'commercial', subtype: 'Shopping Mall', geometry: { type: 'Point', coordinates: [73.0350, 33.7200] }, service_radius_km: 3, capacity: 5000, status: 'operational', address: 'F-7 Markaz', description: 'Popular shopping mall in F-7 commercial area', rating: 3.9 },

  // Monuments
  { name: 'Pakistan Monument', type: 'monument', subtype: 'National Monument', geometry: { type: 'Point', coordinates: [73.0689, 33.6933] }, service_radius_km: 3, capacity: 5000, status: 'operational', address: 'Shakarparian Hills', description: 'National monument representing four provinces and three territories', rating: 4.7 },
  { name: 'Pakistan Monument Museum', type: 'monument', subtype: 'Museum', geometry: { type: 'Point', coordinates: [73.0695, 33.6925] }, service_radius_km: 2, capacity: 2000, status: 'operational', address: 'Shakarparian Hills', description: 'Museum adjacent to Pakistan Monument showcasing national history', rating: 4.3 },
];

// ═══════════════════════════════════════════════════════════
// ISLAMABAD UTILITIES — GeoJSON Lines
// ═══════════════════════════════════════════════════════════
const utilitiesData = [
  { name: 'Main Water Supply Pipeline - Simly Dam', utility_type: 'water', geometry: { type: 'LineString', coordinates: [[73.1500, 33.7300], [73.1200, 33.7200], [73.0800, 33.7100], [73.0500, 33.7000], [73.0200, 33.6900]] }, coverage_area: 'F, G, H Sectors', status: 'active', capacity: '50 MGD', provider: 'CDA Water Wing', length_km: 18.0 },
  { name: 'Khanpur Dam Water Line', utility_type: 'water', geometry: { type: 'LineString', coordinates: [[72.9200, 33.8000], [72.9600, 33.7600], [73.0000, 33.7200], [73.0300, 33.6900]] }, coverage_area: 'Western Sectors', status: 'active', capacity: '35 MGD', provider: 'CDA Water Wing', length_km: 25.0 },
  { name: 'IESCO 132kV Grid Station - G-9', utility_type: 'electricity', geometry: { type: 'LineString', coordinates: [[73.0200, 33.6850], [73.0300, 33.6900], [73.0400, 33.6950], [73.0500, 33.7000], [73.0600, 33.7050]] }, coverage_area: 'G-8, G-9, G-10, G-11', status: 'active', capacity: '132 kV', provider: 'IESCO', length_km: 8.0 },
  { name: 'IESCO 220kV Transmission Line', utility_type: 'electricity', geometry: { type: 'LineString', coordinates: [[72.9500, 33.6800], [73.0000, 33.6900], [73.0500, 33.7000], [73.1000, 33.7100]] }, coverage_area: 'All Islamabad', status: 'active', capacity: '220 kV', provider: 'IESCO', length_km: 20.0 },
  { name: 'SNGPL Gas Main Pipeline - North', utility_type: 'gas', geometry: { type: 'LineString', coordinates: [[73.0100, 33.7300], [73.0200, 33.7200], [73.0300, 33.7100], [73.0400, 33.7000], [73.0500, 33.6900]] }, coverage_area: 'E, F Sectors', status: 'active', capacity: '500 MMCFD', provider: 'SNGPL', length_km: 12.0 },
  { name: 'SNGPL Gas Main Pipeline - South', utility_type: 'gas', geometry: { type: 'LineString', coordinates: [[73.0200, 33.6800], [73.0300, 33.6700], [73.0400, 33.6600], [73.0500, 33.6500]] }, coverage_area: 'G, H, I Sectors', status: 'active', capacity: '400 MMCFD', provider: 'SNGPL', length_km: 10.0 },
  { name: 'Main Sewage Line - Nullah Lai', utility_type: 'sewage', geometry: { type: 'LineString', coordinates: [[73.0600, 33.7200], [73.0550, 33.7100], [73.0500, 33.7000], [73.0450, 33.6900], [73.0400, 33.6800]] }, coverage_area: 'Central Islamabad', status: 'active', capacity: '200 MLD', provider: 'CDA', length_km: 8.0 },
  { name: 'PTCL Fiber Optic Backbone', utility_type: 'fiber', geometry: { type: 'LineString', coordinates: [[73.0100, 33.7200], [73.0300, 33.7100], [73.0500, 33.7000], [73.0700, 33.6900], [73.0900, 33.6800]] }, coverage_area: 'Major Sectors', status: 'active', capacity: '100 Gbps', provider: 'PTCL', length_km: 15.0 },
  { name: 'Telecom Tower Network - Sector G', utility_type: 'telecom', geometry: { type: 'LineString', coordinates: [[73.0200, 33.6850], [73.0350, 33.6900], [73.0500, 33.6950]] }, coverage_area: 'G-8, G-9, G-10', status: 'active', capacity: '5G Ready', provider: 'Jazz/Zong/Telenor', length_km: 5.0 },
  { name: 'CDA Water Treatment Plant Pipeline', utility_type: 'water', geometry: { type: 'LineString', coordinates: [[73.0400, 33.6700], [73.0450, 33.6800], [73.0500, 33.6900], [73.0550, 33.7000]] }, coverage_area: 'I-8, H-8, G-8', status: 'maintenance', capacity: '20 MGD', provider: 'CDA Water Wing', length_km: 6.0 },
  { name: 'IESCO Distribution Line F-Sectors', utility_type: 'electricity', geometry: { type: 'LineString', coordinates: [[73.0200, 33.7300], [73.0300, 33.7250], [73.0400, 33.7200], [73.0500, 33.7150]] }, coverage_area: 'F-6, F-7, F-8, F-9', status: 'active', capacity: '11 kV', provider: 'IESCO', length_km: 6.0 },
  { name: 'Storm Water Drainage - Sector E', utility_type: 'sewage', geometry: { type: 'LineString', coordinates: [[72.9950, 33.7400], [73.0100, 33.7350], [73.0250, 33.7300], [73.0400, 33.7250]] }, coverage_area: 'E-7, E-11', status: 'active', capacity: '50 MLD', provider: 'CDA', length_km: 7.0 },
];

// ═══════════════════════════════════════════════════════════
// POPULATION DATA for each zone
// ═══════════════════════════════════════════════════════════
const populationMeta = [
  { zoneName: 'F-6 Markaz', population_count: 18500, age_distribution: { children: 2200, youth: 5100, adults: 8500, seniors: 2700 }, household_count: 4200, growth_rate: 1.8, income_level: 'upper_middle', employment_rate: 82, literacy_rate: 92 },
  { zoneName: 'F-7 Markaz', population_count: 22000, age_distribution: { children: 3100, youth: 6200, adults: 9800, seniors: 2900 }, household_count: 5100, growth_rate: 2.1, income_level: 'upper_middle', employment_rate: 85, literacy_rate: 94 },
  { zoneName: 'F-8', population_count: 35000, age_distribution: { children: 5500, youth: 9000, adults: 15000, seniors: 5500 }, household_count: 8200, growth_rate: 1.5, income_level: 'upper_middle', employment_rate: 78, literacy_rate: 91 },
  { zoneName: 'G-6', population_count: 12000, age_distribution: { children: 1500, youth: 3200, adults: 5800, seniors: 1500 }, household_count: 2800, growth_rate: 0.8, income_level: 'high', employment_rate: 90, literacy_rate: 96 },
  { zoneName: 'G-8', population_count: 45000, age_distribution: { children: 8000, youth: 12000, adults: 18000, seniors: 7000 }, household_count: 10500, growth_rate: 2.5, income_level: 'middle', employment_rate: 72, literacy_rate: 85 },
  { zoneName: 'G-9', population_count: 52000, age_distribution: { children: 10000, youth: 14000, adults: 20000, seniors: 8000 }, household_count: 12000, growth_rate: 3.0, income_level: 'lower_middle', employment_rate: 68, literacy_rate: 80 },
  { zoneName: 'G-10', population_count: 42000, age_distribution: { children: 7500, youth: 11000, adults: 17000, seniors: 6500 }, household_count: 9800, growth_rate: 2.2, income_level: 'middle', employment_rate: 74, literacy_rate: 87 },
  { zoneName: 'G-11', population_count: 38000, age_distribution: { children: 7000, youth: 10000, adults: 15000, seniors: 6000 }, household_count: 8800, growth_rate: 2.8, income_level: 'middle', employment_rate: 70, literacy_rate: 84 },
  { zoneName: 'I-8', population_count: 28000, age_distribution: { children: 4500, youth: 8000, adults: 11500, seniors: 4000 }, household_count: 6500, growth_rate: 3.5, income_level: 'middle', employment_rate: 75, literacy_rate: 88 },
  { zoneName: 'I-9', population_count: 8000, age_distribution: { children: 1000, youth: 2500, adults: 3800, seniors: 700 }, household_count: 1800, growth_rate: 1.2, income_level: 'lower_middle', employment_rate: 82, literacy_rate: 72 },
  { zoneName: 'I-10', population_count: 32000, age_distribution: { children: 6000, youth: 9000, adults: 12500, seniors: 4500 }, household_count: 7200, growth_rate: 4.0, income_level: 'middle', employment_rate: 71, literacy_rate: 83 },
  { zoneName: 'Blue Area', population_count: 5000, age_distribution: { children: 300, youth: 1200, adults: 3000, seniors: 500 }, household_count: 800, growth_rate: 0.5, income_level: 'high', employment_rate: 95, literacy_rate: 98 },
  { zoneName: 'H-8', population_count: 15000, age_distribution: { children: 2200, youth: 4500, adults: 6300, seniors: 2000 }, household_count: 3500, growth_rate: 1.5, income_level: 'middle', employment_rate: 76, literacy_rate: 90 },
  { zoneName: 'E-7', population_count: 12500, age_distribution: { children: 1800, youth: 3200, adults: 5500, seniors: 2000 }, household_count: 2900, growth_rate: 1.0, income_level: 'high', employment_rate: 88, literacy_rate: 95 },
  { zoneName: 'E-11', population_count: 25000, age_distribution: { children: 4200, youth: 7000, adults: 10500, seniors: 3300 }, household_count: 5800, growth_rate: 5.0, income_level: 'upper_middle', employment_rate: 79, literacy_rate: 90 },
  { zoneName: 'Bahria Town Phase 1-7', population_count: 85000, age_distribution: { children: 15000, youth: 22000, adults: 35000, seniors: 13000 }, household_count: 19500, growth_rate: 4.5, income_level: 'upper_middle', employment_rate: 80, literacy_rate: 91 },
  { zoneName: 'DHA Phase II', population_count: 45000, age_distribution: { children: 7500, youth: 12000, adults: 18500, seniors: 7000 }, household_count: 10200, growth_rate: 6.0, income_level: 'high', employment_rate: 83, literacy_rate: 93 },
];

// ═══════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════
async function seedDatabase() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Zone.deleteMany({}),
      Road.deleteMany({}),
      Landmark.deleteMany({}),
      Utility.deleteMany({}),
      PopulationData.deleteMany({}),
    ]);
    console.log('✅ Cleared all collections');

    // Seed Users
    console.log('👤 Seeding users...');
    const users = await User.create([
      { name: 'Admin User', email: 'admin@urbanpulse.pk', password: 'admin123', role: 'admin' },
      { name: 'Planner User', email: 'planner@urbanpulse.pk', password: 'planner123', role: 'planner' },
      { name: 'Viewer User', email: 'viewer@urbanpulse.pk', password: 'viewer123', role: 'viewer' },
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Seed Zones
    console.log('🗺️  Seeding zones...');
    const zones = await Zone.create(zonesData);
    console.log(`✅ Created ${zones.length} zones`);

    // Seed Roads
    console.log('🛣️  Seeding roads...');
    const roads = await Road.create(roadsData);
    console.log(`✅ Created ${roads.length} roads`);

    // Seed Landmarks
    console.log('📍 Seeding landmarks...');
    const landmarks = await Landmark.create(landmarksData);
    console.log(`✅ Created ${landmarks.length} landmarks`);

    // Seed Utilities
    console.log('⚡ Seeding utilities...');
    const utilities = await Utility.create(utilitiesData);
    console.log(`✅ Created ${utilities.length} utilities`);

    // Seed Population Data (link to zone IDs)
    console.log('👥 Seeding population data...');
    const popData = populationMeta.map((p) => {
      const zone = zones.find((z) => z.name === p.zoneName);
      return {
        zone_id: zone ? zone._id : null,
        zone_name: p.zoneName,
        population_count: p.population_count,
        age_distribution: p.age_distribution,
        household_count: p.household_count,
        growth_rate: p.growth_rate,
        income_level: p.income_level,
        employment_rate: p.employment_rate,
        literacy_rate: p.literacy_rate,
        year: 2026,
      };
    }).filter((p) => p.zone_id !== null);

    const population = await PopulationData.create(popData);
    console.log(`✅ Created ${population.length} population records`);

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Users:      ${users.length}`);
    console.log(`   Zones:      ${zones.length}`);
    console.log(`   Roads:      ${roads.length}`);
    console.log(`   Landmarks:  ${landmarks.length}`);
    console.log(`   Utilities:  ${utilities.length}`);
    console.log(`   Population: ${population.length}`);
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
