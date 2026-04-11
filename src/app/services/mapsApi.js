// ═══════════════════════════════════════════════════════════
// Maps API Service — Frontend wrapper for backend map endpoints
// ═══════════════════════════════════════════════════════════

const API_BASE = '/api';

async function request(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed' };
  return data;
}

const mapsApi = {
  // Search for an area by name
  searchArea: (query) => request('GET', `/maps/search-area?q=${encodeURIComponent(query)}`),

  // Get nearby places
  nearbyPlaces: (lat, lng, radius = 5000, type = 'all') =>
    request('GET', `/maps/nearby-places?lat=${lat}&lng=${lng}&radius=${radius}&type=${type}`),

  // Get roads in area
  roads: (lat, lng, radius = 3000) =>
    request('GET', `/maps/roads?lat=${lat}&lng=${lng}&radius=${radius}`),

  // Get directions
  directions: (olat, olng, dlat, dlng) =>
    request('GET', `/maps/directions?olat=${olat}&olng=${olng}&dlat=${dlat}&dlng=${dlng}`),

  // Reverse geocode
  reverse: (lat, lng) => request('GET', `/maps/reverse?lat=${lat}&lng=${lng}`),

  // Analyze area (fetch + analyze)
  analyzeArea: (lat, lng, radius = 5000, areaName = 'Selected Area') =>
    request('POST', '/maps/analyze-area', { lat, lng, radius, areaName }),

  // Evaluate user layout
  evaluateLayout: (elements, centerLat, centerLng) =>
    request('POST', '/report/evaluate-layout', { elements, centerLat, centerLng }),

  // Generate PDF report (returns blob)
  generateReport: async (lat, lng, radius = 5000, areaName = 'Selected Area') => {
    const res = await fetch(`${API_BASE}/report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, radius, areaName }),
    });
    if (!res.ok) throw new Error('Report generation failed');
    return res.blob();
  },
};

export default mapsApi;
