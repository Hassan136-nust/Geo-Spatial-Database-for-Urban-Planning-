// ═══════════════════════════════════════════════════════════
// Maps API Service — Frontend wrapper for all backend endpoints
// UrbanPulse v2.0 — 18-collection system
// ═══════════════════════════════════════════════════════════

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('urbanpulse_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(method, endpoint, body = null) {
  const config = { method, headers: getAuthHeaders() };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed' };
  return data;
}

const mapsApi = {
  // ─── Maps (original) ────────────────────────────────────
  searchArea: (query) => request('GET', `/maps/search-area?q=${encodeURIComponent(query)}`),
  nearbyPlaces: (lat, lng, radius = 5000, type = 'all') =>
    request('GET', `/maps/nearby-places?lat=${lat}&lng=${lng}&radius=${radius}&type=${type}`),
  roads: (lat, lng, radius = 3000) =>
    request('GET', `/maps/roads?lat=${lat}&lng=${lng}&radius=${radius}`),
  directions: (olat, olng, dlat, dlng) =>
    request('GET', `/maps/directions?olat=${olat}&olng=${olng}&dlat=${dlat}&dlng=${dlng}`),
  reverse: (lat, lng) => request('GET', `/maps/reverse?lat=${lat}&lng=${lng}`),
  analyzeArea: (lat, lng, radius = 5000, areaName = 'Selected Area') =>
    request('POST', '/maps/analyze-area', { lat, lng, radius, areaName }),
  evaluateLayout: (elements, centerLat, centerLng, radius = 5) =>
    request('POST', '/report/evaluate-layout', { elements, centerLat, centerLng, radius }),

  // ─── Reports (with persistence) ─────────────────────────
  generateReport: async (lat, lng, radius = 5000, areaName = 'Selected Area') => {
    const res = await fetch(`${API_BASE}/report/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lat, lng, radius, areaName }),
    });
    if (!res.ok) throw new Error('Report generation failed');
    return res.blob();
  },
  getUserReports: () => request('GET', '/report/history'),
  downloadReport: async (id) => {
    const res = await fetch(`${API_BASE}/report/${id}/download`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Download failed');
    return res.blob();
  },
  deleteReport: (id) => request('DELETE', `/report/${id}`),

  // ─── Areas (persistent search) ──────────────────────────
  searchAndSaveArea: (query, radius = 5000) =>
    request('POST', '/areas/search', { query, radius }),
  getAreaHistory: (page = 1) => request('GET', `/areas/history?page=${page}`),
  getArea: (id) => request('GET', `/areas/${id}`),
  deleteArea: (id) => request('DELETE', `/areas/${id}`),

  // ─── Analytics (persistent) ─────────────────────────────
  runAnalytics: (lat, lng, radius = 5000, areaId = null) =>
    request('POST', '/analytics2/run', { lat, lng, radius, areaId }),
  getAreaAnalytics: (areaId) => request('GET', `/analytics2/area/${areaId}`),

  // ─── Planner (save/load designs) ────────────────────────
  saveDesign: (designName, elements, center, radius = 5, designId = null) =>
    request('POST', '/planner/save', { design_name: designName, elements, center, radius, designId }),
  getUserDesigns: () => request('GET', '/planner/user-designs'),
  getDesign: (id) => request('GET', `/planner/${id}`),
  updateDesign: (id, data) => request('PUT', `/planner/${id}`, data),
  deleteDesign: (id) => request('DELETE', `/planner/${id}`),
  aiGenerateCity: (params) => request('POST', '/planner/ai-generate', params),


  // ─── Landmarks (with caching) ───────────────────────────
  fetchLandmarks: (lat, lng, radius = 5000, city = '', forceRefresh = false) =>
    request('POST', '/landmarks2/fetch', { lat, lng, radius, city, forceRefresh }),
  saveLandmarksBulk: (landmarks, city = '') =>
    request('POST', '/landmarks2/save-bulk', { landmarks, city }),
  addCustomLandmark: (name, type, lat, lng, city = '') =>
    request('POST', '/landmarks2/add', { name, type, lat, lng, city }),
  getLandmarksByCity: (city) => request('GET', `/landmarks2/city/${encodeURIComponent(city)}`),

  // ─── Notifications ──────────────────────────────────────
  getNotifications: (page = 1) => request('GET', `/notifications?page=${page}`),
  getUnreadCount: () => request('GET', '/notifications/unread-count'),
  markNotificationRead: (id) => request('PUT', `/notifications/${id}/read`),
  markAllNotificationsRead: () => request('PUT', '/notifications/read-all'),
  deleteNotification: (id) => request('DELETE', `/notifications/${id}`),

  // ─── Projects ───────────────────────────────────────────
  createProject: (name, description = '', color = '#0ea5e9', tags = []) =>
    request('POST', '/projects', { name, description, color, tags }),
  getProjects: (status = '') => request('GET', `/projects${status ? `?status=${status}` : ''}`),
  getProject: (id) => request('GET', `/projects/${id}`),
  updateProject: (id, data) => request('PUT', `/projects/${id}`, data),
  updateProjectItems: (id, action, type, itemId) =>
    request('PUT', `/projects/${id}/items`, { action, type, itemId }),
  deleteProject: (id) => request('DELETE', `/projects/${id}`),

  // ─── Comparisons ────────────────────────────────────────
  createComparison: (areaIds, name = '', notes = '') =>
    request('POST', '/comparisons', { area_ids: areaIds, name, notes }),
  getComparisons: () => request('GET', '/comparisons'),
  getComparison: (id) => request('GET', `/comparisons/${id}`),
  deleteComparison: (id) => request('DELETE', `/comparisons/${id}`),

  // ─── Zones (live OSM + DB) ──────────────────────────────
  fetchOSMZones: (lat, lng, radius = 10000) =>
    request('GET', `/zones/osm-fetch?lat=${lat}&lng=${lng}&radius=${radius}`),
  saveOSMZone: (zoneData) => request('POST', '/zones/save-osm', zoneData),
  getZones: (params = '') => request('GET', `/zones${params ? `?${params}` : ''}`),
  deleteZone: (id) => request('DELETE', `/zones/${id}`),


  // ─── Map Layers ─────────────────────────────────────────
  createMapLayer: (name, layerType, data = {}) =>
    request('POST', '/map-layers', { name, layer_type: layerType, ...data }),
  getMapLayers: () => request('GET', '/map-layers'),
  getPublicLayers: () => request('GET', '/map-layers/public'),
  getMapLayer: (id) => request('GET', `/map-layers/${id}`),
  updateMapLayer: (id, data) => request('PUT', `/map-layers/${id}`, data),
  addLayerFeatures: (id, features) => request('PUT', `/map-layers/${id}/features`, { features }),
  deleteMapLayer: (id) => request('DELETE', `/map-layers/${id}`),

  // ─── Activity ───────────────────────────────────────────
  getActivityFeed: (page = 1) => request('GET', `/activity?page=${page}`),
  getActivityStats: () => request('GET', '/activity/stats'),

  // ─── Cities ─────────────────────────────────────────────
  getCities: (search = '') => request('GET', `/cities${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getCityProfile: (name) => request('GET', `/cities/${encodeURIComponent(name)}`),
  getCityStats: (name) => request('GET', `/cities/${encodeURIComponent(name)}/stats`),
};

export default mapsApi;

