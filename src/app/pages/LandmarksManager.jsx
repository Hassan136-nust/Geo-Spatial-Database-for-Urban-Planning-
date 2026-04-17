import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { renderToString } from 'react-dom/server';
import { FaHospital, FaSchool, FaTree, FaMosque, FaMapMarkerAlt, FaUniversity } from 'react-icons/fa';
import { MdLocalPolice, MdStoreMallDirectory, MdAccountBalance } from 'react-icons/md';
import L from 'leaflet';
import { GlassPanel } from '../components/GlassPanel';
import { MapPin, Search, Plus, Loader2, Download, Filter, Globe, Trash2, RefreshCw, Database, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LANDMARK_TYPES = [
  { value: 'hospital', label: 'Hospital', icon: <FaHospital />, color: '#ef4444' },
  { value: 'school', label: 'School', icon: <FaSchool />, color: '#3b82f6' },
  { value: 'university', label: 'University', icon: <FaUniversity />, color: '#6366f1' },
  { value: 'park', label: 'Park', icon: <FaTree />, color: '#22c55e' },
  { value: 'religious', label: 'Religious', icon: <FaMosque />, color: '#a855f7' },
  { value: 'commercial', label: 'Commercial', icon: <MdStoreMallDirectory />, color: '#ec4899' },
  { value: 'government', label: 'Government', icon: <MdAccountBalance />, color: '#f59e0b' },
  { value: 'other', label: 'Other', icon: <FaMapMarkerAlt />, color: '#6b7280' },
];

function createIcon(type) {
  const lt = LANDMARK_TYPES.find((t) => t.value === type) || LANDMARK_TYPES[7];
  const iconHtml = renderToString(
    <div style={{ background: lt.color, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
      {lt.icon}
    </div>
  );
  return L.divIcon({
    className: 'custom-marker',
    html: iconHtml,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function MapClickHandler({ onMapClick, pickMode }) {
  useMapEvents({
    click(e) {
      if (pickMode) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Cities with larger radii for areas like NUST campus
const CITIES = [
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479, radius: 8000 },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587, radius: 8000 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011, radius: 8000 },
  { name: 'Rawalpindi', lat: 33.5651, lng: 73.0169, radius: 6000 },
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249, radius: 6000 },
  { name: 'Faisalabad', lat: 31.4504, lng: 73.1350, radius: 6000 },
  { name: 'Multan', lat: 30.1575, lng: 71.5249, radius: 6000 },
  { name: 'Quetta', lat: 30.1798, lng: 66.9750, radius: 6000 },
];

export function LandmarksManager() {
  const { user } = useAuth();
  const [landmarks, setLandmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [customCity, setCustomCity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [mapCenter, setMapCenter] = useState([33.6844, 73.0479]);

  // Add landmark form
  const [newLandmark, setNewLandmark] = useState({ name: '', type: 'hospital', lat: '', lng: '', city: '' });
  const [addingLandmark, setAddingLandmark] = useState(false);
  const [message, setMessage] = useState(null);
  const [fetchedFromOSM, setFetchedFromOSM] = useState(false);
  const [pickMode, setPickMode] = useState(false);

  const handleMapPick = useCallback(async (lat, lng) => {
    setNewLandmark((prev) => ({ ...prev, lat, lng }));
    setPickMode(false);
    try {
      const geoRes = await mapsApi.reverse(lat, lng);
      if (geoRes && geoRes.data && geoRes.data.address) {
        const city = geoRes.data.address.city || geoRes.data.address.town || geoRes.data.address.village || 'Unknown';
        setNewLandmark((prev) => ({ ...prev, city }));
        setMessage({ type: 'success', text: 'Location auto-detected!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch landmarks for selected city — ALWAYS fetches fresh from OSM
  const fetchLandmarksForCity = async (forceRefresh = false) => {
    setFetching(true);
    setMessage(null);
    setFetchedFromOSM(false);
    try {
      const city = customCity.trim() || selectedCity.name;
      let lat = selectedCity.lat;
      let lng = selectedCity.lng;
      let radius = selectedCity.radius || 8000;

      // If custom city, geocode first
      if (customCity.trim()) {
        try {
          const geoRes = await mapsApi.searchArea(customCity.trim());
          if (geoRes.data && geoRes.data.length > 0) {
            lat = geoRes.data[0].lat;
            lng = geoRes.data[0].lng;
            radius = 8000; // Use larger radius for custom cities
          }
        } catch (e) {
          console.error('Geocode error:', e);
        }
      }

      const res = await mapsApi.fetchLandmarks(lat, lng, radius, city, forceRefresh);
      setLandmarks(res.data || []);
      setMapCenter([lat, lng]);
      setFetchedFromOSM(!res.cached);

      const source = res.cached ? 'from cache' : `fetched ${res.fetched} new from OSM`;
      setMessage({
        type: 'success',
        text: `Loaded ${(res.data || []).length} landmarks for ${city} (${source})`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch landmarks' });
    } finally {
      setFetching(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SAVE TO DATABASE — stores all fetched landmarks to MongoDB
  // ═══════════════════════════════════════════════════════════
  const handleSaveToDatabase = async () => {
    if (landmarks.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const city = customCity.trim() || selectedCity.name;
      const res = await mapsApi.saveLandmarksBulk(landmarks, city);
      setMessage({
        type: 'success',
        text: `✅ ${res.saved} landmarks saved to database successfully!`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save to database' });
    } finally {
      setSaving(false);
    }
  };

  // Add custom landmark
  const handleAddLandmark = async () => {
    if (!newLandmark.name || !newLandmark.lat || !newLandmark.lng) return;
    setAddingLandmark(true);
    try {
      const res = await mapsApi.addCustomLandmark(
        newLandmark.name, newLandmark.type,
        parseFloat(newLandmark.lat), parseFloat(newLandmark.lng),
        newLandmark.city || selectedCity.name
      );
      setLandmarks((prev) => [...prev, res.data]);
      setNewLandmark({ name: '', type: 'hospital', lat: '', lng: '', city: '' });
      setMessage({ type: 'success', text: `"${newLandmark.name}" added successfully!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add landmark' });
    } finally {
      setAddingLandmark(false);
    }
  };

  // Filter landmarks
  const filteredLandmarks = useMemo(() => {
    if (!filterType) return landmarks;
    return landmarks.filter((l) => l.type === filterType);
  }, [landmarks, filterType]);

  // Get coordinates for display
  const getLandmarkCoords = (l) => {
    if (l.geometry?.coordinates) {
      return { lat: l.geometry.coordinates[1], lng: l.geometry.coordinates[0] };
    }
    return { lat: l.lat || 0, lng: l.lng || 0 };
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-8 text-center">
        <p className="text-white/50">Please login to manage landmarks</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
            Landmarks Manager
          </h1>
          <p className="text-white/50 mt-2">Fetch landmarks from OpenStreetMap, view on map, and save to database</p>
        </motion.div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* City Selector */}
          <GlassPanel>
            <div className="p-5">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Select City
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => { setSelectedCity(city); setCustomCity(''); setMapCenter([city.lat, city.lng]); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedCity.name === city.name && !customCity
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Or type any city/area name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 mb-3"
              />
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fetchLandmarksForCity(false)}
                  disabled={fetching}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {fetching ? 'Fetching...' : 'Fetch Landmarks'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchLandmarksForCity(true)}
                  disabled={fetching}
                  title="Force refresh from OSM (bypass cache)"
                  className="py-3 px-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white/60 disabled:opacity-30"
                >
                  <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>
          </GlassPanel>

          {/* Add Custom Landmark */}
          <GlassPanel>
            <div className="p-5">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-400" /> Add Custom Landmark
              </h3>
              <div className="space-y-3">
                <input
                  type="text" value={newLandmark.name}
                  onChange={(e) => setNewLandmark({ ...newLandmark, name: e.target.value })}
                  placeholder="Landmark name (e.g. NUST University)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
                <select
                  value={newLandmark.type}
                  onChange={(e) => setNewLandmark({ ...newLandmark, type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50"
                >
                  {LANDMARK_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setPickMode(!pickMode)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${pickMode ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  <MapPin className="w-3.5 h-3.5" /> {pickMode ? 'Click anywhere on map to pick location...' : 'Pick from Map'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" step="any" value={newLandmark.lat}
                    onChange={(e) => setNewLandmark({ ...newLandmark, lat: e.target.value })}
                    placeholder="Latitude"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                  <input
                    type="number" step="any" value={newLandmark.lng}
                    onChange={(e) => setNewLandmark({ ...newLandmark, lng: e.target.value })}
                    placeholder="Longitude"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddLandmark}
                  disabled={!newLandmark.name || !newLandmark.lat || !newLandmark.lng || addingLandmark}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingLandmark ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add to Database
                </motion.button>
              </div>
            </div>
          </GlassPanel>

          {/* Stats, Filters & Save */}
          <GlassPanel>
            <div className="p-5">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" /> Filter & Stats
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{landmarks.length}</div>
                  <div className="text-xs text-white/40">Total</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{filteredLandmarks.length}</div>
                  <div className="text-xs text-white/40">Showing</div>
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 mb-3"
              >
                <option value="" className="bg-gray-900">All Types</option>
                {LANDMARK_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>
                ))}
              </select>
              {/* Type breakdown */}
              <div className="space-y-1.5 max-h-24 overflow-y-auto mb-3">
                {LANDMARK_TYPES.map((t) => {
                  const count = landmarks.filter((l) => l.type === t.value).length;
                  if (count === 0) return null;
                  return (
                    <div key={t.value} className="flex items-center justify-between text-xs py-1">
                      <span className="text-white/60 flex items-center gap-2">{t.icon} {t.label}</span>
                      <span className="text-white/80 font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
              {/* ═══ SAVE TO DATABASE BUTTON ═══ */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveToDatabase}
                disabled={landmarks.length === 0 || saving}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {saving ? 'Saving...' : `Save ${landmarks.length} to Database`}
              </motion.button>
            </div>
          </GlassPanel>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 px-5 py-3 rounded-xl text-sm flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : null}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map + Table Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <GlassPanel>
            <div className="rounded-2xl overflow-hidden" style={{ height: 480 }}>
              <MapContainer center={mapCenter} zoom={12} className="h-full w-full" style={{ background: '#0a0a0f' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapClickHandler onMapClick={handleMapPick} pickMode={pickMode} />
                {filteredLandmarks.map((l, i) => {
                  const coords = getLandmarkCoords(l);
                  if (!coords.lat || !coords.lng) return null;
                  return (
                    <Marker key={l._id || `lm-${i}`} position={[coords.lat, coords.lng]} icon={createIcon(l.type)}>
                      <Popup>
                        <div style={{ minWidth: 160 }}>
                          <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13 }}>{l.name}</h3>
                          <p style={{ margin: '0 0 2px', color: '#666', fontSize: 11, textTransform: 'capitalize' }}>{l.type}</p>
                          {l.address && <p style={{ margin: '0 0 2px', color: '#888', fontSize: 10 }}>{l.address}</p>}
                          <p style={{ margin: '0', color: '#0ea5e9', fontSize: 10 }}>{l.source || 'osm'} source</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </GlassPanel>

          {/* Table */}
          <GlassPanel>
            <div className="p-4">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" /> Landmarks ({filteredLandmarks.length})
              </h3>
              {loading || fetching ? (
                <div className="text-center py-16">
                  <Loader2 className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                  <p className="text-white/40 text-sm mt-3">Loading landmarks...</p>
                </div>
              ) : filteredLandmarks.length === 0 ? (
                <div className="text-center py-16">
                  <MapPin className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 text-sm">No landmarks found</p>
                  <p className="text-white/25 text-xs mt-1">Select a city and click "Fetch Landmarks" to get started</p>
                  <p className="text-white/20 text-xs mt-1">Try clicking ↻ to force refresh from OSM</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  {filteredLandmarks.slice(0, 150).map((l, i) => {
                    const coords = getLandmarkCoords(l);
                    const typeInfo = LANDMARK_TYPES.find((t) => t.value === l.type) || LANDMARK_TYPES[7];
                    return (
                      <motion.div
                        key={l._id || `l-${i}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl hover:bg-white/8 transition-colors"
                      >
                        <span className="flex-shrink-0 text-lg">{typeInfo.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/80 truncate">{l.name}</p>
                          <p className="text-[10px] text-white/30 capitalize">{l.type} • {coords.lat?.toFixed(4)}, {coords.lng?.toFixed(4)}</p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          l.source === 'user' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {l.source || 'osm'}
                        </span>
                      </motion.div>
                    );
                  })}
                  {filteredLandmarks.length > 150 && (
                    <p className="text-center text-xs text-white/30 py-2">Showing first 150 of {filteredLandmarks.length} landmarks</p>
                  )}
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
