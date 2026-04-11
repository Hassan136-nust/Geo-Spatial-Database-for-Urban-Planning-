import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GlassPanel } from '../components/GlassPanel';
import { Trash2, RotateCcw, Download, Lightbulb, AlertTriangle, CheckCircle, Loader2, GripVertical, FileDown, ChevronRight, X, ChevronDown, ChevronUp, Zap, Info, Shield } from 'lucide-react';
import mapsApi from '../services/mapsApi';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PLANNER_ITEMS = [
  { type: 'house', label: 'Houses', emoji: '🏠', color: '#3b82f6', desc: 'Residential area' },
  { type: 'hospital', label: 'Hospital', emoji: '🏥', color: '#ef4444', desc: 'Healthcare facility' },
  { type: 'school', label: 'School', emoji: '🏫', color: '#6366f1', desc: 'Educational institution' },
  { type: 'park', label: 'Park', emoji: '🌳', color: '#22c55e', desc: 'Green space / recreation' },
  { type: 'road', label: 'Road', emoji: '🛣️', color: '#f97316', desc: 'Road / connectivity' },
  { type: 'mosque', label: 'Mosque', emoji: '🕌', color: '#a855f7', desc: 'Place of worship' },
  { type: 'mall', label: 'Mall', emoji: '🛍️', color: '#ec4899', desc: 'Shopping center' },
  { type: 'police', label: 'Police', emoji: '🚔', color: '#1e40af', desc: 'Police station' },
  { type: 'industrial', label: 'Industrial', emoji: '🏭', color: '#78716c', desc: 'Industrial zone' },
];

// Distance thresholds for line coloring (km)
const DISTANCE_THRESHOLDS = {
  hospital: { ideal: 2, acceptable: 5 },
  school: { ideal: 1, acceptable: 3 },
  park: { ideal: 0.5, acceptable: 2 },
};

function createPlannerIcon(type) {
  const item = PLANNER_ITEMS.find((i) => i.type === type) || PLANNER_ITEMS[0];
  return L.divIcon({
    className: 'planner-marker',
    html: `<div style="background:${item.color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);cursor:grab;transition:transform 0.2s;" onmouseenter="this.style.transform='scale(1.2)'" onmouseleave="this.style.transform='scale(1)'">${item.emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function PlacementMode({ activeTool, onPlace }) {
  useMapEvents({
    click(e) {
      if (activeTool) {
        onPlace(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Draggable marker component
function DraggableMarker({ element, onDragEnd, onDelete }) {
  const markerRef = useRef(null);
  return (
    <Marker
      ref={markerRef}
      position={[element.lat, element.lng]}
      icon={createPlannerIcon(element.type)}
      draggable={true}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const pos = marker.getLatLng();
            onDragEnd(element.id, pos.lat, pos.lng);
          }
        },
      }}
    >
      <Popup>
        <div style={{ minWidth: 140 }}>
          <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13 }}>
            {PLANNER_ITEMS.find((i) => i.type === element.type)?.emoji} {PLANNER_ITEMS.find((i) => i.type === element.type)?.label}
          </h3>
          <p style={{ margin: '0 0 6px', color: '#666', fontSize: 11 }}>
            {element.lat.toFixed(5)}, {element.lng.toFixed(5)}
          </p>
          <button
            onClick={() => onDelete(element.id)}
            style={{
              background: '#ef4444', color: 'white', border: 'none', padding: '4px 10px',
              borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}
          >
            Remove
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export function Planner() {
  const [elements, setElements] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [mapCenter] = useState([33.6844, 73.0479]);
  const [toast, setToast] = useState(null);
  const [expandedSection, setExpandedSection] = useState('score');
  const analyzeTimerRef = useRef(null);

  // Auto-analyze on element changes (debounced)
  useEffect(() => {
    if (elements.length < 2) {
      setAnalysis(null);
      return;
    }
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = setTimeout(() => {
      runAnalysis();
    }, 800);
    return () => { if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current); };
  }, [elements]);

  const runAnalysis = useCallback(async () => {
    if (elements.length < 2) return;
    setAnalyzing(true);
    try {
      const centerLat = elements.reduce((sum, e) => sum + e.lat, 0) / elements.length;
      const centerLng = elements.reduce((sum, e) => sum + e.lng, 0) / elements.length;
      const result = await mapsApi.evaluateLayout(elements, centerLat, centerLng);
      setAnalysis(result.data);
      setShowResults(true);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [elements]);

  // Placement feedback logic
  const getPlacementFeedback = useCallback((type, lat, lng) => {
    const houses = elements.filter((e) => e.type === 'house' || e.type === 'residential');
    const hospitals = elements.filter((e) => e.type === 'hospital');
    const schools = elements.filter((e) => e.type === 'school');

    if (type === 'hospital' && houses.length > 0) {
      const nearestHouse = houses.reduce((min, h) => {
        const d = haversineDistance(lat, lng, h.lat, h.lng);
        return d < min.d ? { d } : min;
      }, { d: Infinity });
      if (nearestHouse.d <= 2) return { type: 'success', message: '✅ Great! Hospital within ideal range of residential area' };
      if (nearestHouse.d <= 5) return { type: 'info', message: '👍 Good placement — within acceptable range' };
      return { type: 'warning', message: '⚠️ Hospital too far from residential areas!' };
    }

    if (type === 'school' && houses.length > 0) {
      const nearestHouse = houses.reduce((min, h) => {
        const d = haversineDistance(lat, lng, h.lat, h.lng);
        return d < min.d ? { d } : min;
      }, { d: Infinity });
      if (nearestHouse.d <= 1) return { type: 'success', message: '✅ Perfect school placement near housing!' };
      if (nearestHouse.d <= 3) return { type: 'info', message: '👍 School within acceptable range' };
      return { type: 'warning', message: '⚠️ School too far from residential areas!' };
    }

    if (type === 'industrial' && houses.length > 0) {
      const nearestHouse = houses.reduce((min, h) => {
        const d = haversineDistance(lat, lng, h.lat, h.lng);
        return d < min.d ? { d } : min;
      }, { d: Infinity });
      if (nearestHouse.d < 2) return { type: 'warning', message: '⚠️ Industrial zone too close to housing! Keep >2km away' };
      return { type: 'success', message: '✅ Good — industrial zone is safely distanced from housing' };
    }

    if (type === 'house') {
      if (hospitals.length === 0 && schools.length === 0) {
        return { type: 'info', message: 'ℹ️ Add hospitals & schools near residential areas' };
      }
    }

    return null;
  }, [elements]);

  const handlePlace = useCallback((lat, lng) => {
    if (!activeTool) return;
    const newElement = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: activeTool,
      lat,
      lng,
    };
    setElements((prev) => [...prev, newElement]);

    // Show placement feedback toast
    const feedback = getPlacementFeedback(activeTool, lat, lng);
    if (feedback) {
      setToast(feedback);
      setTimeout(() => setToast(null), 3000);
    }
  }, [activeTool, getPlacementFeedback]);

  const handleDragEnd = useCallback((id, lat, lng) => {
    setElements((prev) => prev.map((el) => el.id === id ? { ...el, lat, lng } : el));
  }, []);

  const handleDelete = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const handleClear = useCallback(() => {
    setElements([]);
    setAnalysis(null);
  }, []);

  const handleExportGeoJSON = useCallback(() => {
    const geojson = {
      type: 'FeatureCollection',
      features: elements.map((el) => ({
        type: 'Feature',
        properties: { type: el.type, id: el.id },
        geometry: { type: 'Point', coordinates: [el.lng, el.lat] },
      })),
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urban-plan.geojson';
    a.click();
    URL.revokeObjectURL(url);
  }, [elements]);

  const handleImportGeoJSON = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const geojson = JSON.parse(event.target.result);
        if (geojson.features) {
          const imported = geojson.features
            .filter((f) => f.geometry?.type === 'Point')
            .map((f) => ({
              id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: f.properties?.type || 'house',
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            }));
          setElements((prev) => [...prev, ...imported]);
        }
      } catch (err) {
        alert('Invalid GeoJSON file');
      }
    };
    reader.readAsText(file);
  }, []);

  // Compute distance lines with color-coding
  const distanceLines = useMemo(() => {
    const houses = elements.filter((e) => e.type === 'house' || e.type === 'residential');
    const lines = [];

    const facilityTypes = [
      { key: 'hospital', items: elements.filter((e) => e.type === 'hospital'), thresholds: DISTANCE_THRESHOLDS.hospital },
      { key: 'school', items: elements.filter((e) => e.type === 'school'), thresholds: DISTANCE_THRESHOLDS.school },
      { key: 'park', items: elements.filter((e) => e.type === 'park'), thresholds: DISTANCE_THRESHOLDS.park },
    ];

    houses.forEach((house) => {
      facilityTypes.forEach(({ key, items, thresholds }) => {
        if (items.length === 0) return;
        let minDist = Infinity;
        let nearest = null;
        items.forEach((f) => {
          const d = haversineDistance(house.lat, house.lng, f.lat, f.lng);
          if (d < minDist) { minDist = d; nearest = f; }
        });
        if (nearest) {
          let color;
          if (minDist <= thresholds.ideal) color = '#22c55e'; // green
          else if (minDist <= thresholds.acceptable) color = '#eab308'; // yellow
          else color = '#ef4444'; // red

          lines.push({
            id: `${house.id}-${key}`,
            positions: [[house.lat, house.lng], [nearest.lat, nearest.lng]],
            color,
            distance: minDist,
            type: key,
          });
        }
      });
    });

    return lines;
  }, [elements]);

  // Industrial buffer zones
  const industrialBuffers = useMemo(() => {
    return elements.filter((e) => e.type === 'industrial').map((el) => ({
      id: el.id,
      center: [el.lat, el.lng],
      radius: 2000, // 2km buffer
    }));
  }, [elements]);

  const severityColors = {
    critical: 'bg-red-500/10 border-red-500/20 text-red-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    success: 'bg-green-500/10 border-green-500/20 text-green-300',
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Count by type for summary bar
  const typeCounts = useMemo(() => {
    const counts = {};
    PLANNER_ITEMS.forEach((item) => {
      counts[item.type] = elements.filter((e) => e.type === item.type).length;
    });
    return counts;
  }, [elements]);

  return (
    <div className="min-h-screen pt-20 relative" style={{ background: '#0a0a0f' }}>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -30, x: '-50%' }}
            className={`fixed top-24 left-1/2 z-[2000] px-5 py-3 rounded-2xl text-sm font-medium backdrop-blur-xl border shadow-2xl ${
              toast.type === 'success' ? 'bg-green-500/15 border-green-500/30 text-green-300' :
              toast.type === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
              'bg-blue-500/15 border-blue-500/30 text-blue-300'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool Palette - Left Side */}
      <div className="absolute top-24 left-4 z-[1000] w-56">
        <div className="bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GripVertical className="w-3.5 h-3.5" /> Planning Tools
          </h3>
          <div className="space-y-1.5">
            {PLANNER_ITEMS.map((item) => (
              <motion.button
                key={item.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTool(activeTool === item.type ? null : item.type)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs ${
                  activeTool === item.type
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-white ring-1 ring-cyan-500/30'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-[10px] text-white/40">{item.desc}</div>
                </div>
                {typeCounts[item.type] > 0 && (
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{typeCounts[item.type]}</span>
                )}
              </motion.button>
            ))}
          </div>

          {activeTool && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 text-center"
            >
              Click on the map to place {PLANNER_ITEMS.find((i) => i.type === activeTool)?.label}
            </motion.div>
          )}

          <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
            <div className="flex gap-2 text-[10px] text-white/50">
              <span className="bg-white/5 px-2 py-1 rounded">{elements.length} placed</span>
              {analyzing && <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" />analyzing</span>}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={runAnalysis}
                disabled={elements.length < 2 || analyzing}
                className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-[10px] font-semibold disabled:opacity-40 flex items-center justify-center gap-1"
              >
                {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
                Analyze
              </button>
              <button onClick={handleClear} disabled={elements.length === 0} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/60 disabled:opacity-40 flex items-center justify-center gap-1">
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={handleExportGeoJSON} disabled={elements.length === 0} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/60 disabled:opacity-40 flex items-center justify-center gap-1">
                <Download className="w-3 h-3" /> Export
              </button>
              <label className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/60 cursor-pointer flex items-center justify-center gap-1 hover:bg-white/10">
                <FileDown className="w-3 h-3" /> Import
                <input type="file" accept=".geojson,.json" onChange={handleImportGeoJSON} className="hidden" />
              </label>
            </div>

            {/* Line legend */}
            {elements.filter((e) => e.type === 'house').length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[9px] text-white/40 mb-1.5">Distance Lines</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <div className="w-4 h-0.5 bg-green-400 rounded" /> <span className="text-green-400">Ideal range</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <div className="w-4 h-0.5 bg-yellow-400 rounded" /> <span className="text-yellow-400">Acceptable</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <div className="w-4 h-0.5 bg-red-400 rounded" /> <span className="text-red-400">Too far</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Map */}
        <div className={`flex-1 transition-all duration-300 ${showResults && analysis ? 'mr-[380px]' : ''}`}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            className="h-full w-full"
            style={{ background: '#0a0a0f', cursor: activeTool ? 'crosshair' : 'grab' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <PlacementMode activeTool={activeTool} onPlace={handlePlace} />

            {/* Placed elements */}
            {elements.map((el) => (
              <DraggableMarker
                key={el.id}
                element={el}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
              />
            ))}

            {/* Distance lines — color-coded by quality */}
            {distanceLines.map((line) => (
              <Polyline
                key={line.id}
                positions={line.positions}
                pathOptions={{
                  color: line.color,
                  weight: 2,
                  dashArray: line.color === '#22c55e' ? '' : '6 4',
                  opacity: 0.6,
                }}
              >
                <Popup>
                  <div style={{ fontSize: 11 }}>
                    <strong>{line.type}</strong>: {line.distance.toFixed(2)} km
                    <br />
                    <span style={{ color: line.color }}>
                      {line.color === '#22c55e' ? '✅ Ideal' : line.color === '#eab308' ? '⚠️ Acceptable' : '❌ Too far'}
                    </span>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* Industrial buffer zones */}
            {industrialBuffers.map((buf) => (
              <Circle
                key={`ind-buf-${buf.id}`}
                center={buf.center}
                radius={buf.radius}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.06,
                  weight: 1,
                  dashArray: '8 4',
                }}
              />
            ))}
          </MapContainer>
        </div>

        {/* Analysis Results Sidebar */}
        <AnimatePresence>
          {showResults && analysis && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-20 right-0 w-[380px] h-[calc(100vh-5rem)] bg-black/90 backdrop-blur-xl border-l border-white/10 z-[999] overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                    Layout Analysis
                  </h2>
                  <button onClick={() => setShowResults(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                {/* Score */}
                <div className={`rounded-xl p-5 border mb-4 ${
                  analysis.score >= 75 ? 'bg-green-500/10 border-green-500/20' :
                  analysis.score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50">Planning Score</span>
                    {analysis.score >= 75 ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                     analysis.score >= 50 ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> :
                     <AlertTriangle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="text-4xl font-bold mb-1">{analysis.score}<span className="text-lg text-white/40">/100</span></div>
                  <div className={`text-sm font-semibold ${
                    analysis.score >= 75 ? 'text-green-400' :
                    analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{analysis.rating}</div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.score}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full ${
                        analysis.score >= 75 ? 'bg-green-500' :
                        analysis.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Summary counts */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-3">
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Elements Placed</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Houses', count: analysis.summary?.houses || 0, emoji: '🏠' },
                      { label: 'Hospitals', count: analysis.summary?.hospitals || 0, emoji: '🏥' },
                      { label: 'Schools', count: analysis.summary?.schools || 0, emoji: '🏫' },
                      { label: 'Parks', count: analysis.summary?.parks || 0, emoji: '🌳' },
                      { label: 'Roads', count: analysis.summary?.roads || 0, emoji: '🛣️' },
                      { label: 'Total', count: analysis.summary?.totalElements || 0, emoji: '📍' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 rounded-lg p-2">
                        <div className="text-sm">{s.emoji}</div>
                        <div className="text-lg font-bold">{s.count}</div>
                        <div className="text-[9px] text-white/40">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div className="bg-white/5 rounded-xl border border-white/10 mb-3 overflow-hidden">
                    <button onClick={() => toggleSection('strengths')} className="w-full p-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Strengths ({analysis.strengths.length})
                      </h4>
                      {expandedSection === 'strengths' ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                    </button>
                    {expandedSection === 'strengths' && (
                      <div className="px-3 pb-3 space-y-1.5">
                        {analysis.strengths.map((s, i) => (
                          <div key={i} className="text-xs p-2.5 rounded-lg bg-green-500/5 border border-green-500/15 text-green-300">
                            <span className="mr-1">{s.icon}</span> {s.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Weaknesses */}
                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <div className="bg-white/5 rounded-xl border border-white/10 mb-3 overflow-hidden">
                    <button onClick={() => toggleSection('weaknesses')} className="w-full p-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Weaknesses ({analysis.weaknesses.length})
                      </h4>
                      {expandedSection === 'weaknesses' ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                    </button>
                    {expandedSection === 'weaknesses' && (
                      <div className="px-3 pb-3 space-y-1.5">
                        {analysis.weaknesses.map((w, i) => (
                          <div key={i} className={`text-xs p-2.5 rounded-lg border ${
                            w.severity === 'critical' ? 'bg-red-500/5 border-red-500/15 text-red-300' : 'bg-amber-500/5 border-amber-500/15 text-amber-300'
                          }`}>
                            <span className="mr-1">{w.icon}</span> {w.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button onClick={() => toggleSection('recommendations')} className="w-full p-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Recommendations ({(analysis.recommendations || []).length})
                    </h4>
                    {expandedSection === 'recommendations' ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                  </button>
                  {expandedSection === 'recommendations' && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {(analysis.recommendations || []).map((rec, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`text-xs p-3 rounded-lg border ${severityColors[rec.severity] || severityColors.info}`}
                        >
                          <span className="mr-1">{rec.icon}</span> {rec.message}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
