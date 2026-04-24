import axios from 'axios';

// ═══════════════════════════════════════════════════════════
// OpenStreetMap Service Layer — 100% Free APIs
// Nominatim (Geocoding) + Overpass (Places) + OSRM (Routing)
// ═══════════════════════════════════════════════════════════

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter'
];
const OSRM_BASE = 'https://router.project-osrm.org';
const USER_AGENT = 'UrbanPulse/1.0 (urban-planning-tool)';

// ─────────────────────────────────────────────────────────
// CACHING & RATE LIMITING
// ─────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

function getCacheKey(type, lat, lng, radius) {
  // Round coordinates to ~110m precision for cache hits (3 decimal places)
  return `${type}_${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache] HIT for ${key}`);
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

let lastOverpassCall = 0;

async function throttleOverpass() {
  const now = Date.now();
  const diff = now - lastOverpassCall;
  // Minimum 2 seconds between Overpass calls to prevent 429
  if (diff < 2000) {
    const waitMs = 2000 - diff;
    console.log(`[Overpass] Throttling: waiting ${waitMs}ms...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastOverpassCall = Date.now();
}

async function fetchOverpassData(query, timeout = 30000) {
  await throttleOverpass();
  
  let lastError;
  // Try each endpoint sequentially until one succeeds
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const { data } = await axios.post(endpoint, `data=${encodeURIComponent(query)}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
        timeout: timeout,
      });
      return data;
    } catch (err) {
      lastError = err;
      const status = err.response?.status || 'network';
      console.warn(`[Overpass] ${endpoint} failed (${status}):`, err.message);
      
      // If rate limited (429), wait before trying next endpoint
      if (status === 429) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
  console.error('[Overpass] All endpoints failed. Last error:', lastError?.message);
  throw lastError;
}

/**
 * fetchOverpassWithRetry — wraps fetchOverpassData with automatic retry
 * on 429/504 errors. Will attempt up to `maxRetries` times with backoff.
 */
async function fetchOverpassWithRetry(query, timeout = 15000, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fetchOverpassData(query, timeout);
      return data;
    } catch (err) {
      const status = err.response?.status || 0;
      if (attempt < maxRetries && (status === 429 || status === 504 || status === 0)) {
        const backoff = (attempt + 1) * 3000; // 3s, 6s
        console.log(`[Overpass] Retry ${attempt + 1}/${maxRetries} after ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
      } else {
        throw err;
      }
    }
  }
}

// Rate limiting helper (Nominatim requires max 1 req/sec)
let lastNominatimCall = 0;
async function throttleNominatim() {
  const now = Date.now();
  const diff = now - lastNominatimCall;
  if (diff < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - diff));
  }
  lastNominatimCall = Date.now();
}

// ─────────────────────────────────────────────────────────
// GEOCODING — Search for an area by name
// ─────────────────────────────────────────────────────────
export async function searchArea(query) {
  await throttleNominatim();
  const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
    params: {
      q: query,
      format: 'json',
      addressdetails: 1,
      limit: 5,
      polygon_geojson: 1,
    },
    headers: { 'User-Agent': USER_AGENT },
  });

  return data.map((item) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    boundingBox: item.boundingbox?.map(Number), // [south, north, west, east]
    type: item.type,
    category: item.category,
    address: item.address,
    geojson: item.geojson,
    importance: item.importance,
  }));
}

// ─────────────────────────────────────────────────────────
// REVERSE GEOCODING — Coordinates to address
// ─────────────────────────────────────────────────────────
export async function reverseGeocode(lat, lng) {
  await throttleNominatim();
  const { data } = await axios.get(`${NOMINATIM_BASE}/reverse`, {
    params: {
      lat,
      lon: lng,
      format: 'json',
      addressdetails: 1,
    },
    headers: { 'User-Agent': USER_AGENT },
  });

  return {
    displayName: data.display_name,
    address: data.address,
    lat: parseFloat(data.lat),
    lng: parseFloat(data.lon),
  };
}

// ─────────────────────────────────────────────────────────
// NEARBY PLACES — Fetch from OpenStreetMap via Overpass
// ─────────────────────────────────────────────────────────
const OSM_TYPE_MAP = {
  hospital: '["amenity"="hospital"]',
  clinic: '["amenity"="clinic"]',
  school: '["amenity"="school"]',
  university: '["amenity"="university"]',
  park: '["leisure"="park"]',
  mosque: '["amenity"~"place_of_worship|mosque"]',
  church: '["amenity"~"place_of_worship|church"]',
  restaurant: '["amenity"="restaurant"]',
  pharmacy: '["amenity"="pharmacy"]',
  bank: '["amenity"="bank"]',
  police: '["amenity"="police"]',
  fire_station: '["amenity"="fire_station"]',
  library: '["amenity"="library"]',
  mall: '["shop"="mall"]',
  supermarket: '["shop"="supermarket"]',
  fuel: '["amenity"="fuel"]',
  parking: '["amenity"="parking"]',
  playground: '["leisure"="playground"]',
  sports: '["leisure"="sports_centre"]',
  government: '["office"="government"]',
};

export async function getNearbyPlaces(lat, lng, radiusMeters = 5000, type = 'hospital') {
  const osmFilter = OSM_TYPE_MAP[type] || `["amenity"="${type}"]`;
  
  const query = `
    [out:json][timeout:25];
    (
      node${osmFilter}(around:${radiusMeters},${lat},${lng});
      way${osmFilter}(around:${radiusMeters},${lat},${lng});
      relation${osmFilter}(around:${radiusMeters},${lat},${lng});
    );
    out center body;
  `;

  let data;
  try {
    data = await fetchOverpassWithRetry(query, 30000, 2);
  } catch(err) {
    return [];
  }

  return (data.elements || []).map((el) => ({
    id: el.id,
    name: el.tags?.name || el.tags?.['name:en'] || `Unnamed ${type}`,
    type: type,
    lat: el.lat || el.center?.lat,
    lng: el.lon || el.center?.lon,
    tags: el.tags || {},
    address: formatOSMAddress(el.tags),
    phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
    website: el.tags?.website || el.tags?.['contact:website'] || '',
    openingHours: el.tags?.opening_hours || '',
    distance: haversineDistance(lat, lng, el.lat || el.center?.lat, el.lon || el.center?.lon),
  }));
}

// Fetch multiple types at once — with retry on failure and caching
export async function getNearbyAllTypes(lat, lng, radiusMeters = 5000) {
  const cacheKey = getCacheKey('all', lat, lng, radiusMeters);
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  // Use highly-optimized Regex queries for Overpass to prevent timeouts
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"^(hospital|clinic|school|university|pharmacy|bank|police|fire_station|place_of_worship|mosque|restaurant)$"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"^(hospital|clinic|school|university|pharmacy|bank|police|fire_station|place_of_worship|mosque|restaurant)$"](around:${radiusMeters},${lat},${lng});
      node["leisure"~"^(park|playground|sports_centre)$"](around:${radiusMeters},${lat},${lng});
      way["leisure"~"^(park|playground|sports_centre)$"](around:${radiusMeters},${lat},${lng});
      node["shop"~"^(mall|supermarket)$"](around:${radiusMeters},${lat},${lng});
      way["shop"~"^(mall|supermarket)$"](around:${radiusMeters},${lat},${lng});
      node["office"~"^(government)$"](around:${radiusMeters},${lat},${lng});
      way["office"~"^(government)$"](around:${radiusMeters},${lat},${lng});
    );
    out center body;
  `;

  try {
    // Use retry wrapper — this is the most critical query
    const data = await fetchOverpassWithRetry(query, 15000, 2);

    const results = (data.elements || []).map((el) => ({
      id: el.id,
      name: el.tags?.name || el.tags?.['name:en'] || 'Unnamed',
      type: classifyOSMElement(el.tags),
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon,
      tags: el.tags || {},
      address: formatOSMAddress(el.tags),
      distance: haversineDistance(lat, lng, el.lat || el.center?.lat, el.lon || el.center?.lon),
    }));

    console.log(`[OSM] getNearbyAllTypes: ${results.length} places found for (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    setCache(cacheKey, results);
    return results;
  } catch (err) {
    console.error('[OSM] getNearbyAllTypes error (all retries exhausted):', err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// ROADS — Fetch road network from Overpass
// ─────────────────────────────────────────────────────────
export async function getRoads(lat, lng, radiusMeters = 3000) {
  const cacheKey = getCacheKey('roads', lat, lng, radiusMeters);
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  const query = `
    [out:json][timeout:15];
    (
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"](around:${radiusMeters},${lat},${lng});
    );
    out body geom;
  `;

  try {
    const data = await fetchOverpassWithRetry(query, 15000, 1);

    const resultRoads = (data.elements || []).map((el) => ({
      id: el.id,
      name: el.tags?.name || 'Unnamed Road',
      type: el.tags?.highway || 'road',
      lanes: parseInt(el.tags?.lanes) || 2,
      maxSpeed: el.tags?.maxspeed || 'unknown',
      surface: el.tags?.surface || 'unknown',
      geometry: el.geometry
        ? el.geometry.map((pt) => [pt.lat, pt.lng || pt.lon])
        : [],
    }));
    setCache(cacheKey, resultRoads);
    return resultRoads;
  } catch (err) {
    console.error('[OSM] Roads fetch error (all retries exhausted):', err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// ROUTING — Get directions between two points via OSRM
// ─────────────────────────────────────────────────────────
export async function getDirections(originLat, originLng, destLat, destLng) {
  const url = `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`;
  
  const { data } = await axios.get(url, {
    params: {
      overview: 'full',
      geometries: 'geojson',
      steps: true,
    },
    headers: { 'User-Agent': USER_AGENT },
  });

  if (data.code !== 'Ok' || !data.routes?.length) {
    return null;
  }

  const route = data.routes[0];
  return {
    distance: route.distance, // meters
    duration: route.duration, // seconds
    geometry: route.geometry,
    steps: route.legs[0]?.steps?.map((s) => ({
      instruction: s.maneuver?.instruction || s.name || '',
      distance: s.distance,
      duration: s.duration,
    })),
  };
}

// ─────────────────────────────────────────────────────────
// ADMIN BOUNDARIES — Fetch zone polygons from Overpass
// ─────────────────────────────────────────────────────────
export async function getAdminBoundaries(lat, lng, radiusMeters = 10000) {
  const cacheKey = getCacheKey('admin_bounds', lat, lng, radiusMeters);
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  // Query for administrative boundaries and major suburbs/neighborhoods
  const query = `
    [out:json][timeout:15];
    (
      relation["boundary"="administrative"]["admin_level"~"^(8|9|10)$"](around:${radiusMeters},${lat},${lng});
      relation["landuse"="residential"]["name"](around:${radiusMeters},${lat},${lng});
      way["landuse"="residential"]["name"](around:${radiusMeters},${lat},${lng});
      relation["place"~"suburb|neighbourhood"]["name"](around:${radiusMeters},${lat},${lng});
      way["place"~"suburb|neighbourhood"]["name"](around:${radiusMeters},${lat},${lng});
    );
    out body geom;
  `;

  try {
    const data = await fetchOverpassWithRetry(query, 15000, 2);
    const boundaries = (data.elements || [])
      .map(el => {
        let rings = [];
        
        // Build polygon from relation's outer ways or from a single way
        if (el.type === 'relation' && el.members) {
          const outerMembers = el.members.filter(m => m.role === 'outer' && m.geometry);
          if (outerMembers.length === 0) return null;
          rings = outerMembers.map(m => m.geometry.map(pt => [pt.lon, pt.lat]));
        } else if (el.type === 'way' && el.geometry) {
          rings = [el.geometry.map(pt => [pt.lon, pt.lat])];
        } else {
          return null;
        }

        // Close the ring if not already closed
        rings.forEach(ring => {
          if (ring.length > 0) {
            const first = ring[0];
            const last = ring[ring.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              ring.push([...first]);
            }
          }
        });

        // Calculate centroid from first ring
        const mainRing = rings[0] || [];
        let cLat = 0, cLng = 0;
        mainRing.forEach(([lon, la]) => { cLat += la; cLng += lon; });
        if (mainRing.length > 0) { cLat /= mainRing.length; cLng /= mainRing.length; }

        // Estimate area in sq km (rough bounding box approach)
        let areaSqKm = 0;
        if (mainRing.length > 2) {
          const lats = mainRing.map(c => c[1]);
          const lngs = mainRing.map(c => c[0]);
          const latRange = Math.max(...lats) - Math.min(...lats);
          const lngRange = Math.max(...lngs) - Math.min(...lngs);
          areaSqKm = parseFloat((latRange * 111 * lngRange * 111 * Math.cos(cLat * Math.PI / 180) * 0.6).toFixed(2));
        }

        // Filter out tiny slivers (e.g., less than 0.1 sq km) unless they are specifically suburbs
        if (areaSqKm < 0.1 && el.tags?.place !== 'suburb' && el.tags?.place !== 'neighbourhood') {
           return null;
        }

        return {
          osm_id: el.id,
          name: el.tags?.name || el.tags?.['name:en'] || `Zone ${el.id}`,
          admin_level: parseInt(el.tags?.admin_level) || (el.tags?.place === 'suburb' ? 9 : 10),
          zone_type: classifyBoundaryType(el.tags),
          description: [el.tags?.['name:en'], el.tags?.place || el.tags?.landuse || 'zone'].filter(Boolean).join(' · '),
          center: { lat: cLat, lng: cLng },
          area_sqkm: areaSqKm,
          geometry: {
            type: 'Polygon',
            coordinates: rings.length > 0 ? [rings[0]] : [],
          },
          tags: el.tags || {},
        };
      })
      .filter(Boolean)
      .filter(b => b.geometry.coordinates.length > 0 && b.geometry.coordinates[0].length >= 4);

    // Sort by area so major ones come first
    boundaries.sort((a, b) => b.area_sqkm - a.area_sqkm);

    console.log(`[OSM] getAdminBoundaries: ${boundaries.length} boundaries found for (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    setCache(cacheKey, boundaries);
    return boundaries;
  } catch (err) {
    console.error('[OSM] getAdminBoundaries error:', err.message);
    return [];
  }
}

function classifyBoundaryType(tags) {
  if (!tags) return 'administrative';
  const name = (tags.name || '').toLowerCase();
  if (tags.landuse === 'residential' || name.includes('residential')) return 'residential';
  if (tags.landuse === 'commercial' || name.includes('commercial') || name.includes('market')) return 'commercial';
  if (tags.landuse === 'industrial' || name.includes('industrial')) return 'industrial';
  if (tags.leisure === 'park' || tags.landuse === 'recreation_ground') return 'green';
  if (name.includes('university') || name.includes('school') || name.includes('college')) return 'institutional';
  return 'administrative';
}

// ─────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function classifyOSMElement(tags) {
  if (!tags) return 'other';
  if (tags.amenity === 'hospital') return 'hospital';
  if (tags.amenity === 'clinic') return 'clinic';
  if (tags.amenity === 'school') return 'school';
  if (tags.amenity === 'university') return 'university';
  if (tags.amenity === 'pharmacy') return 'pharmacy';
  if (tags.amenity === 'bank') return 'bank';
  if (tags.amenity === 'police') return 'police';
  if (tags.amenity === 'fire_station') return 'fire_station';
  if (tags.amenity === 'place_of_worship' || tags.amenity === 'mosque' || tags.building === 'mosque') {
    if (tags.religion === 'christian' || tags.amenity === 'church' || tags.building === 'church') return 'church';
    if (tags.religion === 'muslim' || tags.amenity === 'mosque' || tags.building === 'mosque') return 'mosque';
    return 'religious';
  }
  if (tags.leisure === 'park') return 'park';
  if (tags.leisure === 'playground') return 'playground';
  if (tags.shop === 'mall') return 'mall';
  if (tags.office === 'government') return 'government';
  return tags.amenity || tags.leisure || tags.shop || 'other';
}

function formatOSMAddress(tags) {
  if (!tags) return '';
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
  ].filter(Boolean);
  return parts.join(', ') || '';
}

export default {
  searchArea,
  reverseGeocode,
  getNearbyPlaces,
  getNearbyAllTypes,
  getRoads,
  getDirections,
  getAdminBoundaries,
};
