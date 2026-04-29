import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GlassPanel } from '../components/GlassPanel';
import { Trash2, RotateCcw, Download, Lightbulb, AlertTriangle, CheckCircle, Loader2, GripVertical, FileDown, ChevronRight, X, ChevronDown, ChevronUp, Zap, Info, Shield, Save, FolderOpen, Bot, Wand2, Undo2 } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { FaHome, FaHospital, FaSchool, FaTree, FaRoad, FaMosque, FaShoppingBag, FaIndustry, FaMapMarkerAlt } from 'react-icons/fa';
import { MdLocalPolice } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';
import { useSearchParams } from 'react-router';
import { MAP_TILE_URL, MAP_ATTRIBUTION } from '../config/mapTiler';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PLANNER_ITEMS = [
  { type: 'house', label: 'Houses', icon: <FaHome />, color: '#3b82f6', desc: 'Residential area' },
  { type: 'hospital', label: 'Hospital', icon: <FaHospital />, color: '#ef4444', desc: 'Healthcare facility' },
  { type: 'school', label: 'School', icon: <FaSchool />, color: '#6366f1', desc: 'Educational institution' },
  { type: 'park', label: 'Park', icon: <FaTree />, color: '#22c55e', desc: 'Green space / recreation' },
  { type: 'road', label: 'Road', icon: <FaRoad />, color: '#f97316', desc: 'Road / connectivity' },
  { type: 'mosque', label: 'Mosque', icon: <FaMosque />, color: '#a855f7', desc: 'Place of worship' },
  { type: 'mall', label: 'Mall', icon: <FaShoppingBag />, color: '#ec4899', desc: 'Shopping center' },
  { type: 'police', label: 'Police', icon: <MdLocalPolice />, color: '#1e40af', desc: 'Police station' },
  { type: 'industrial', label: 'Industrial', icon: <FaIndustry />, color: '#78716c', desc: 'Industrial zone' },
];

// Distance thresholds for line coloring (km)
const DISTANCE_THRESHOLDS = {
  hospital: { ideal: 2, acceptable: 5 },
  school: { ideal: 1, acceptable: 3 },
  park: { ideal: 0.5, acceptable: 2 },
};

function createPlannerIcon(type, deleteMode = false) {
  const item = PLANNER_ITEMS.find((i) => i.type === type) || PLANNER_ITEMS[0];
  const bg = deleteMode ? '#ef4444' : item.color;
  const cursor = deleteMode ? 'pointer' : 'grab';
  const iconHtml = renderToString(
    <div style={{ background: bg, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'white', border: deleteMode ? '3px solid #fca5a5' : '3px solid white', boxShadow: deleteMode ? '0 0 12px rgba(239,68,68,0.7)' : '0 4px 12px rgba(0,0,0,0.4)', cursor, transition: 'transform 0.2s' }}>
      {deleteMode ? '✕' : item.icon}
    </div>
  );
  return L.divIcon({
    className: 'planner-marker',
    html: iconHtml,
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
function DraggableMarker({ element, onDragEnd, onDelete, deleteMode }) {
  const markerRef = useRef(null);
  return (
    <Marker
      ref={markerRef}
      position={[element.lat, element.lng]}
      icon={createPlannerIcon(element.type, deleteMode)}
      draggable={!deleteMode}
      eventHandlers={{
        click() {
          if (deleteMode) onDelete(element.id);
        },
        dragend() {
          if (deleteMode) return;
          const marker = markerRef.current;
          if (marker) {
            const pos = marker.getLatLng();
            onDragEnd(element.id, pos.lat, pos.lng);
          }
        },
      }}
    >
      {!deleteMode && (
        <Popup>
          <div style={{ minWidth: 140 }}>
            <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {PLANNER_ITEMS.find((i) => i.type === element.type)?.icon} {element.label || PLANNER_ITEMS.find((i) => i.type === element.type)?.label}
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
      )}
    </Marker>
  );
}

export function Planner() {
  const [elements, setElements] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiForm, setAiForm] = useState({
    cityName: 'New City',
    population: 50000,
    houses: 10,
    hospitals: 2,
    schools: 3,
    parks: 3,
    mosques: 2,
    malls: 1,
    police: 1,
    industrial: 1,
    roads: 4,
    radiusKm: 5,
    additionalNotes: '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [radius, setRadius] = useState(5);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter] = useState([33.6844, 73.0479]);
  const mapRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [expandedSection, setExpandedSection] = useState('score');
  const analyzeTimerRef = useRef(null);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // ── Save/Load state ──
  const [designName, setDesignName] = useState('');
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const autoSaveTimerRef = useRef(null);

  // Auto-save design to backend whenever elements change
  useEffect(() => {
    if (elements.length === 0 || !user) return;
    
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        if (currentDesignId) {
          // If we already have an ID, we just need to update it
          await mapsApi.updateDesign(currentDesignId, { elements, radius });
        } else {
          // No ID yet? This is a new unsaved session. Auto-create a draft.
          const center = {
            lat: elements.reduce((s, e) => s + e.lat, 0) / elements.length,
            lng: elements.reduce((s, e) => s + e.lng, 0) / elements.length,
          };
          const name = designName || `Auto-Saved City (${new Date().toLocaleDateString()})`;
          const res = await mapsApi.saveDesign(name, elements, center, radius);
          if (res.data && res.data._id) {
            setCurrentDesignId(res.data._id);
            if (!designName) setDesignName(name);
          }
        }
      } catch (err) {
        console.error('Auto-save error:', err);
      }
    }, 2000); // Wait 2 seconds after the last change before saving

    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [elements, user, currentDesignId, designName]);

  // Auto-load design from URL ?load=designId
  useEffect(() => {
    const loadId = searchParams.get('load');
    if (loadId && user) {
      (async () => {
        try {
          const res = await mapsApi.getDesign(loadId);
          const design = res.data;
          setElements(design.elements.map((e) => ({ id: e.element_id, type: e.type, lat: e.lat, lng: e.lng })));
          setDesignName(design.design_name);
          setCurrentDesignId(design._id);
          if (design.radius) setRadius(design.radius);
          setToast({ type: 'success', message: `Loaded "${design.design_name}"` });
          setTimeout(() => setToast(null), 3000);
        } catch (err) {
          console.error('Load design error:', err);
          setToast({ type: 'error', message: 'Failed to load design' });
          setTimeout(() => setToast(null), 3000);
        }
      })();
    }
  }, [searchParams, user]);

  const handleSaveDesign = useCallback(async () => {
    if (!designName.trim() || !user) return;
    setSaving(true);
    try {
      const center = {
        lat: elements.reduce((s, e) => s + e.lat, 0) / elements.length || 33.6844,
        lng: elements.reduce((s, e) => s + e.lng, 0) / elements.length || 73.0479,
      };
      const res = await mapsApi.saveDesign(designName, elements, center, radius, currentDesignId);
      setCurrentDesignId(res.data._id);
      setShowSaveDialog(false);
      setToast({ type: 'success', message: `Design "${designName}" saved!` });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setToast({ type: 'error', message: 'Failed to save design' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [designName, elements, user, currentDesignId]);

  // Auto-analyze silently on element or radius changes (debounced)
  // Does NOT open the sidebar — only updates the data in the background
  useEffect(() => {
    if (elements.length < 2) {
      setAnalysis(null);
      return;
    }
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = setTimeout(async () => {
      // Silent background analysis — no UI side-effects
      try {
        const centerLat = elements.reduce((sum, e) => sum + e.lat, 0) / elements.length;
        const centerLng = elements.reduce((sum, e) => sum + e.lng, 0) / elements.length;
        const result = await mapsApi.evaluateLayout(elements, centerLat, centerLng, radius);
        setAnalysis(result.data);
        // NOTE: setShowResults intentionally NOT called here
      } catch (err) {
        console.error('Background analysis error:', err);
      }
    }, 800);
    return () => { if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current); };
  }, [elements, radius]);

  // Manual analysis — triggered by the Analyze button, opens the sidebar
  const runAnalysis = useCallback(async () => {
    if (elements.length < 2) return;
    setAnalyzing(true);
    try {
      const centerLat = elements.reduce((sum, e) => sum + e.lat, 0) / elements.length;
      const centerLng = elements.reduce((sum, e) => sum + e.lng, 0) / elements.length;
      const result = await mapsApi.evaluateLayout(elements, centerLat, centerLng, radius);
      setAnalysis(result.data);
      setShowResults(true); // Only opens sidebar when user explicitly presses Analyze
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [elements, radius]);

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
      if (nearestHouse.d <= 2) return { type: 'success', message: 'Great! Hospital within ideal range of residential area' };
      if (nearestHouse.d <= 5) return { type: 'info', message: 'Good placement — within acceptable range' };
      return { type: 'warning', message: 'Hospital too far from residential areas!' };
    }

    if (type === 'school' && houses.length > 0) {
      const nearestHouse = houses.reduce((min, h) => {
        const d = haversineDistance(lat, lng, h.lat, h.lng);
        return d < min.d ? { d } : min;
      }, { d: Infinity });
      if (nearestHouse.d <= 1) return { type: 'success', message: 'Perfect school placement near housing!' };
      if (nearestHouse.d <= 3) return { type: 'info', message: 'School within acceptable range' };
      return { type: 'warning', message: 'School too far from residential areas!' };
    }

    if (type === 'industrial' && houses.length > 0) {
      const nearestHouse = houses.reduce((min, h) => {
        const d = haversineDistance(lat, lng, h.lat, h.lng);
        return d < min.d ? { d } : min;
      }, { d: Infinity });
      if (nearestHouse.d < 2) return { type: 'warning', message: 'Industrial zone too close to housing! Keep >2km away' };
      return { type: 'success', message: 'Good — industrial zone is safely distanced from housing' };
    }

    if (type === 'house') {
      if (hospitals.length === 0 && schools.length === 0) {
        return { type: 'info', message: 'Add hospitals & schools near residential areas' };
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
    setElements((prev) => {
      const newElements = [...prev, newElement];
      if (currentDesignId) {
        mapsApi.updateDesign(currentDesignId, { elements: newElements, radius }).catch(console.error);
      }
      return newElements;
    });

    // Show placement feedback toast
    const feedback = getPlacementFeedback(activeTool, lat, lng);
    if (feedback) {
      setToast(feedback);
      setTimeout(() => setToast(null), 3000);
    }
  }, [activeTool, getPlacementFeedback, currentDesignId]);

  const handleDragEnd = useCallback((id, lat, lng) => {
    setElements((prev) => {
      const newElements = prev.map((el) => el.id === id ? { ...el, lat, lng } : el);
      if (currentDesignId) {
        mapsApi.updateDesign(currentDesignId, { elements: newElements, radius }).catch(console.error);
      }
      return newElements;
    });
  }, [currentDesignId]);

  const handleDelete = useCallback((id) => {
    setElements((prev) => {
      const newElements = prev.filter((el) => el.id !== id);
      if (currentDesignId) {
        mapsApi.updateDesign(currentDesignId, { elements: newElements, radius }).catch(console.error);
      }
      return newElements;
    });
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
  }, [currentDesignId]);

  const handleClear = useCallback(() => {
    setElements([]);
    setAnalysis(null);
    setActiveTool(null);
    setDeleteMode(false);
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
  }, []);

  // Undo: removes last placed element
  const handleUndoLast = useCallback(() => {
    setElements((prev) => {
      if (prev.length === 0) return prev;
      const newElements = prev.slice(0, -1);
      if (currentDesignId) {
        mapsApi.updateDesign(currentDesignId, { elements: newElements, radius }).catch(console.error);
      }
      return newElements;
    });
    if (mapRef.current) mapRef.current.closePopup();
  }, [currentDesignId]);

  // AI City Generation
  const handleAiGenerate = useCallback(async () => {
    setAiGenerating(true);
    try {
      const result = await mapsApi.aiGenerateCity({
        ...aiForm,
        centerLat: mapRef.current?.getCenter()?.lat || 33.6844,
        centerLng: mapRef.current?.getCenter()?.lng || 73.0479,
      });
      if (result.success && result.data?.elements) {
        const newElements = result.data.elements;
        setElements((prev) => [...prev, ...newElements]);
        setShowAiPanel(false);
        
        // Auto-pan map to new city center
        if (mapRef.current && newElements.length > 0) {
          const avgLat = newElements.reduce((s, e) => s + e.lat, 0) / newElements.length;
          const avgLng = newElements.reduce((s, e) => s + e.lng, 0) / newElements.length;
          mapRef.current.flyTo([avgLat, avgLng], 14, { duration: 2 });
        }

        const engineLabel = result.data.engine === 'gemini' ? '🤖 Gemini AI' : '⚙️ Smart Planner';
        setToast({ type: 'success', message: `✨ ${engineLabel} generated ${newElements.length} elements for ${aiForm.cityName}` });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'AI generation failed. Check your GEMINI_API_KEY.' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setAiGenerating(false);
    }
  }, [aiForm]);


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
    <div className={`min-h-screen pt-20 relative ${deleteMode ? 'delete-mode-active' : ''}`} style={{ background: '#f4f7f6' }}>
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

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveDialog && (
          <div className="fixed inset-0 z-[3000] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
              <GlassPanel>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900/90">Save Design</h3>
                    <button onClick={() => setShowSaveDialog(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-800 transition-colors" /></button>
                  </div>
                  <input
                    type="text"
                    placeholder="E.g., Downtown Expansion"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    className="w-full bg-white/5 border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-purple-500/50 transition-colors"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setShowSaveDialog(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleSaveDesign} disabled={saving || !designName.trim()} className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── AI City Generator Modal ─────────────────────── */}
      <AnimatePresence>
        {showAiPanel && (
          <div className="fixed inset-0 z-[3000] bg-green-900/30 backdrop-blur-sm flex items-start justify-center pt-20 px-4 pb-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              className="w-full max-w-lg"
            >
              <div className="bg-white border border-green-200 rounded-2xl shadow-2xl shadow-green-900/20 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-2">
                      <Bot className="w-5 h-5 text-violet-500" /> AI City Generator
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">Smart urban planner · Works instantly · Gemini AI if key is configured</p>
                  </div>
                  <button onClick={() => setShowAiPanel(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-500 hover:text-gray-800" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">City Name</label>
                      <input type="text" value={aiForm.cityName} onChange={(e) => setAiForm((f) => ({ ...f, cityName: e.target.value }))} placeholder="e.g. Islamabad East" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors text-gray-900 placeholder-gray-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Population</label>
                      <input type="number" value={aiForm.population} onChange={(e) => setAiForm((f) => ({ ...f, population: +e.target.value }))} min={1000} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors text-gray-900" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">City Radius (km)</label>
                    <div className="flex gap-2">
                      {[3, 5, 8, 12].map((r) => (
                        <button key={r} onClick={() => setAiForm((f) => ({ ...f, radiusKm: r }))} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${aiForm.radiusKm === r ? 'bg-violet-600 border border-violet-600 text-white shadow-md' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'}`}>{r} km</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-2">Element Counts</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'houses', label: '🏠 Houses' },
                        { key: 'hospitals', label: '🏥 Hospitals' },
                        { key: 'schools', label: '🏫 Schools' },
                        { key: 'parks', label: '🌳 Parks' },
                        { key: 'mosques', label: '🕌 Mosques' },
                        { key: 'malls', label: '🛍️ Malls' },
                        { key: 'police', label: '🚔 Police' },
                        { key: 'industrial', label: '🏭 Industrial' },
                        { key: 'roads', label: '🛣️ Roads' },
                      ].map(({ key, label }) => (
                        <div key={key} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                          <div className="text-[10px] text-gray-600 mb-1.5 font-medium">{label}</div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setAiForm((f) => ({ ...f, [key]: Math.max(0, f[key] - 1) }))} className="w-6 h-6 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center text-sm hover:bg-gray-300 transition-colors font-bold">−</button>
                            <span className="flex-1 text-center text-sm font-bold text-gray-900">{aiForm[key]}</span>
                            <button onClick={() => setAiForm((f) => ({ ...f, [key]: f[key] + 1 }))} className="w-6 h-6 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center text-sm hover:bg-gray-300 transition-colors font-bold">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">Additional Instructions (optional)</label>
                    <textarea value={aiForm.additionalNotes} onChange={(e) => setAiForm((f) => ({ ...f, additionalNotes: e.target.value }))} placeholder="e.g. Keep industrial zones near the eastern border. Add a university near city center." rows={3} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors text-gray-900 placeholder-gray-400 resize-none" />
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-[11px] text-violet-700 flex gap-2">
                    <Bot className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-violet-500" />
                    <span>AI places elements around the <strong className="text-violet-800">current map center</strong>. Pan the map to your target location first. Existing elements are preserved — you can edit manually afterwards.</span>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowAiPanel(false)} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleAiGenerate} disabled={aiGenerating || !aiForm.cityName.trim()} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/30">
                      {aiGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Wand2 className="w-4 h-4" /> Generate City</>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Mode Banner ──────────────────────────── */}
      <AnimatePresence>
        {deleteMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-[1500] px-5 py-2.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2 backdrop-blur-xl shadow-xl"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Mode Active — Click any marker to remove it
            <button onClick={() => setDeleteMode(false)} className="ml-2 text-red-300/60 hover:text-red-200 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool Palette - Left Side */}
      <div className="absolute top-24 left-4 z-[1000] w-56">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-gray-900 ring-1 ring-cyan-500/30'
                    : 'bg-white/5 border border-gray-200 text-gray-700 hover:bg-white/10'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-[10px] text-gray-500">{item.desc}</div>
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

          {/* Radius Selector */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-[10px] font-bold text-gray-900/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Evaluation Radius
            </h4>
            <div className="grid grid-cols-3 gap-1">
              {[5, 10, 15].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-2 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                    radius === r
                      ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 ring-1 ring-cyan-500/30'
                      : 'bg-white/5 border border-gray-200 text-gray-900/50 hover:bg-white/10'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5">Score adjusts based on radius</p>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <div className="flex gap-2 text-[10px] text-gray-900/50">
              <span className="bg-white/5 px-2 py-1 rounded">{elements.length} placed</span>
              {analyzing && <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" />analyzing</span>}
            </div>

            {/* AI Generate Button */}
            <button
              onClick={() => { setShowAiPanel(true); setDeleteMode(false); setActiveTool(null); }}
              className="w-full px-3 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-900/30"
            >
              <Bot className="w-3.5 h-3.5" /> AI City Generator ✨
            </button>

            {/* Delete / Undo / Analyze / Clear */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={runAnalysis}
                disabled={elements.length < 2 || analyzing}
                className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-[10px] font-semibold disabled:opacity-40 flex items-center justify-center gap-1"
              >
                {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
                Analyze
              </button>
              <button
                onClick={() => { setDeleteMode((d) => !d); setActiveTool(null); }}
                disabled={elements.length === 0}
                className={`px-3 py-2 rounded-lg text-[10px] font-semibold disabled:opacity-40 flex items-center justify-center gap-1 transition-all ${
                  deleteMode
                    ? 'bg-red-500/25 border border-red-400/50 text-red-300 ring-1 ring-red-500/30'
                    : 'bg-white/5 border border-gray-200 text-gray-600 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20'
                }`}
              >
                <Trash2 className="w-3 h-3" /> {deleteMode ? 'Click to Del' : 'Delete'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={handleUndoLast} disabled={elements.length === 0} className="px-2 py-2 bg-white/5 border border-gray-200 rounded-lg text-[10px] text-gray-600 disabled:opacity-40 flex items-center justify-center gap-1 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/20 transition-all">
                <Undo2 className="w-3 h-3" /> Undo
              </button>
              <button onClick={handleClear} disabled={elements.length === 0} className="px-2 py-2 bg-white/5 border border-gray-200 rounded-lg text-[10px] text-gray-600 disabled:opacity-40 flex items-center justify-center gap-1 hover:bg-white/10 transition-all">
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
              <button onClick={handleExportGeoJSON} disabled={elements.length === 0} className="px-2 py-2 bg-white/5 border border-gray-200 rounded-lg text-[10px] text-gray-600 disabled:opacity-40 flex items-center justify-center gap-1 hover:bg-white/10 transition-all">
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <label className="px-3 py-2 bg-white/5 border border-gray-200 rounded-lg text-[10px] text-gray-600 cursor-pointer flex items-center justify-center gap-1 hover:bg-white/10 col-span-2">
                <FileDown className="w-3 h-3" /> Import GeoJSON
                <input type="file" accept=".geojson,.json" onChange={handleImportGeoJSON} className="hidden" />
              </label>
            </div>
            {user && (
              <button onClick={() => setShowSaveDialog(true)} disabled={elements.length === 0} className="w-full mt-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors">
                <Save className="w-3 h-3" /> Save / Update Design
              </button>
            )}

            {/* Line legend */}
            {elements.filter((e) => e.type === 'house').length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-[9px] text-gray-500 mb-1.5">Distance Lines</p>
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
            style={{ background: '#f4f7f6', cursor: activeTool ? 'crosshair' : 'grab' }}
            zoomControl={false}
            ref={mapRef}
          >
            <TileLayer
              attribution={MAP_ATTRIBUTION}
              url={MAP_TILE_URL}
            />
            <PlacementMode activeTool={deleteMode ? null : activeTool} onPlace={handlePlace} />

            {/* Placed elements */}
            {elements.map((el) => (
              <DraggableMarker
                key={el.id}
                element={el}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
                deleteMode={deleteMode}
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
                      {line.color === '#22c55e' ? 'Ideal' : line.color === '#eab308' ? 'Acceptable' : 'Too far'}
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

            {/* Evaluation radius circle overlay */}
            {elements.length >= 2 && (
              <Circle
                center={[
                  elements.reduce((s, e) => s + e.lat, 0) / elements.length,
                  elements.reduce((s, e) => s + e.lng, 0) / elements.length,
                ]}
                radius={radius * 1000}
                pathOptions={{
                  color: '#06b6d4',
                  fillColor: '#06b6d4',
                  fillOpacity: 0.04,
                  weight: 1.5,
                  dashArray: '10 6',
                }}
              />
            )}
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
              className="fixed top-20 right-0 w-[380px] h-[calc(100vh-5rem)] bg-white/95 backdrop-blur-xl border-l border-gray-200 z-[999] overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                    Layout Analysis
                  </h2>
                  <button onClick={() => setShowResults(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                    <X className="w-4 h-4 text-pure-white/70" />
                  </button>
                </div>

                {/* Score */}
                <div className={`rounded-xl p-5 border mb-4 ${
                  analysis.score >= 75 ? 'bg-green-500/10 border-green-500/20' :
                  analysis.score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-pure-white/50">Planning Score</span>
                    {analysis.score >= 75 ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                     analysis.score >= 50 ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> :
                     <AlertTriangle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="text-4xl font-bold mb-1 text-pure-white">{analysis.score}<span className="text-lg text-pure-white/50">/100</span></div>
                  <div className={`text-sm font-semibold ${
                    analysis.score >= 75 ? 'text-green-400' :
                    analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{analysis.rating}</div>
                  {analysis.evaluationRadius && (
                    <div className="mt-1.5 text-[10px] text-pure-white/40 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Evaluated at {analysis.evaluationRadius}km radius
                      {analysis.summary?.elementsOutOfRadius > 0 && (
                        <span className="text-amber-400 ml-1">({analysis.summary.elementsOutOfRadius} outside)</span>
                      )}
                    </div>
                  )}
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
                <div className="bg-white/5 rounded-xl p-4 border border-pure-white/10 mb-3">
                  <h4 className="text-xs font-bold text-pure-white/60 uppercase tracking-wider mb-3">Elements Placed</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Houses', count: analysis.summary?.houses || 0, icon: <FaHome /> },
                      { label: 'Hospitals', count: analysis.summary?.hospitals || 0, icon: <FaHospital /> },
                      { label: 'Schools', count: analysis.summary?.schools || 0, icon: <FaSchool /> },
                      { label: 'Parks', count: analysis.summary?.parks || 0, icon: <FaTree /> },
                      { label: 'Roads', count: analysis.summary?.roads || 0, icon: <FaRoad /> },
                      { label: 'Total', count: analysis.summary?.totalElements || 0, icon: <FaMapMarkerAlt /> },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 rounded-lg p-2 flex flex-col items-center">
                        <div className="text-sm mb-1 text-pure-white">{s.icon}</div>
                        <div className="text-lg font-bold text-pure-white">{s.count}</div>
                        <div className="text-[9px] text-pure-white/40">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div className="bg-white/5 rounded-xl border border-gray-200 mb-3 overflow-hidden">
                    <button onClick={() => toggleSection('strengths')} className="w-full p-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-pure-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Strengths ({analysis.strengths.length})
                      </h4>
                      {expandedSection === 'strengths' ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
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
                  <div className="bg-white/5 rounded-xl border border-gray-200 mb-3 overflow-hidden">
                    <button onClick={() => toggleSection('weaknesses')} className="w-full p-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-pure-white/60 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Weaknesses ({analysis.weaknesses.length})
                      </h4>
                      {expandedSection === 'weaknesses' ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
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
                <div className="bg-white/5 rounded-xl border border-gray-200 overflow-hidden">
                  <button onClick={() => toggleSection('recommendations')} className="w-full p-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-pure-white/60 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Recommendations ({(analysis.recommendations || []).length})
                    </h4>
                    {expandedSection === 'recommendations' ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
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
