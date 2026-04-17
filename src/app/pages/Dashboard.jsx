import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap as useLeafletMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GlassPanel } from '../components/GlassPanel';
import { Search, MapPin, Stethoscope, GraduationCap, Trees, Building2, Layers, X, ChevronRight, AlertTriangle, CheckCircle, Loader2, Navigation2, FileDown, Shield, TrendingUp, Minus, ChevronDown, ChevronUp, Zap, Target } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { FaHospital, FaSchool, FaTree, FaMosque, FaPills, FaUniversity, FaMapMarkerAlt, FaShoppingBag, FaLandmark } from 'react-icons/fa';
import { MdLocalPolice, MdLocalFireDepartment, MdLocalHospital } from 'react-icons/md';
import { BsBank } from 'react-icons/bs';
import { useMap } from '../context/MapContext';
import mapsApi from '../services/mapsApi';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons by type
const MARKER_COLORS = {
  hospital: '#ef4444', clinic: '#f97316', school: '#3b82f6', university: '#6366f1',
  park: '#22c55e', playground: '#4ade80', mosque: '#a855f7', religious: '#a855f7',
  police: '#1e40af', fire_station: '#dc2626', pharmacy: '#06b6d4', bank: '#eab308',
  mall: '#ec4899', government: '#f59e0b', other: '#6b7280',
};

const MARKER_ICONS = {
  hospital: <FaHospital />, clinic: <MdLocalHospital />, school: <FaSchool />, university: <FaUniversity />,
  park: <FaTree />, playground: <FaTree />, mosque: <FaMosque />, religious: <FaMosque />,
  police: <MdLocalPolice />, fire_station: <MdLocalFireDepartment />, pharmacy: <FaPills />, bank: <BsBank />,
  mall: <FaShoppingBag />, government: <FaLandmark />, other: <FaMapMarkerAlt />,
};

// Coverage radius for visualization (in meters)
const COVERAGE_RADII = {
  hospital: 5000, school: 3000, park: 2000, police: 5000, fire_station: 6000,
};

function createCustomIcon(type) {
  const color = MARKER_COLORS[type] || '#6b7280';
  const iconElement = MARKER_ICONS[type] || <FaMapMarkerAlt />;
  const iconHtml = renderToString(
    <div style={{ background: color, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'white', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'pointer', transition: 'transform 0.2s' }}>
      {iconElement}
    </div>
  );
  return L.divIcon({
    className: 'custom-marker',
    html: iconHtml,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Cluster icon
function createClusterIcon(count) {
  const size = count > 20 ? 44 : count > 10 ? 38 : 32;
  const color = count > 20 ? '#ef4444' : count > 10 ? '#f59e0b' : '#3b82f6';
  return L.divIcon({
    className: 'cluster-marker',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.4);cursor:pointer;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Map controller component
function MapController({ center, zoom }) {
  const map = useLeafletMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Click handler
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Simple marker clustering logic
function clusterMarkers(places, zoomLevel) {
  if (zoomLevel >= 15 || places.length <= 30) return { markers: places, clusters: [] };

  const gridSize = zoomLevel >= 13 ? 0.005 : zoomLevel >= 11 ? 0.02 : 0.05;
  const grid = {};

  places.forEach((p) => {
    if (!p.lat || !p.lng) return;
    const key = `${Math.floor(p.lat / gridSize)}_${Math.floor(p.lng / gridSize)}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(p);
  });

  const markers = [];
  const clusters = [];

  Object.values(grid).forEach((group) => {
    if (group.length === 1) {
      markers.push(group[0]);
    } else if (group.length <= 3) {
      markers.push(...group);
    } else {
      const avgLat = group.reduce((s, p) => s + p.lat, 0) / group.length;
      const avgLng = group.reduce((s, p) => s + p.lng, 0) / group.length;
      clusters.push({ lat: avgLat, lng: avgLng, count: group.length, items: group });
    }
  });

  return { markers, clusters };
}

export function Dashboard() {
  const {
    mapCenter, mapZoom, searchQuery, setSearchQuery,
    selectedArea, nearbyPlaces, roads, analysis,
    loading, error, layers, toggleLayer,
    searchAndLoadArea, loadAreaData, loadRoads,
  } = useMap();

  const [searchInput, setSearchInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(12);
  const [expandedSection, setExpandedSection] = useState('score');
  const searchRef = useRef(null);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!searchInput.trim()) return;
    await searchAndLoadArea(searchInput.trim());
  }, [searchInput, searchAndLoadArea]);

  const handleMapClick = useCallback(async (lat, lng) => {
    await loadAreaData(lat, lng);
    loadRoads(lat, lng);
  }, [loadAreaData, loadRoads]);

  const handleDownloadReport = useCallback(async () => {
    if (!selectedArea) return;
    setGenerating(true);
    try {
      const blob = await mapsApi.generateReport(
        selectedArea.lat, selectedArea.lng, 5000,
        selectedArea.displayName || 'Selected Area'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UrbanPulse_Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setGenerating(false);
    }
  }, [selectedArea]);

  // Filter places by active layers
  const visiblePlaces = useMemo(() => nearbyPlaces.filter((p) => {
    if (p.type === 'hospital' || p.type === 'clinic') return layers.hospitals;
    if (p.type === 'school' || p.type === 'university') return layers.schools;
    if (p.type === 'park' || p.type === 'playground') return layers.parks;
    if (p.type === 'mosque' || p.type === 'religious') return layers.mosques;
    if (p.type === 'bank') return layers.banks;
    if (p.type === 'police') return layers.police;
    if (p.type === 'pharmacy') return layers.pharmacies;
    return true;
  }), [nearbyPlaces, layers]);

  // Cluster markers based on zoom level
  const { markers: individualMarkers, clusters } = useMemo(
    () => clusterMarkers(visiblePlaces, currentZoom),
    [visiblePlaces, currentZoom]
  );

  // Coverage circle color based on overall score
  const getAreaCircleColor = () => {
    if (!analysis) return '#0ea5e9';
    if (analysis.score >= 70) return '#22c55e';
    if (analysis.score >= 50) return '#eab308';
    return '#ef4444';
  };

  // Zoom tracker
  function ZoomTracker() {
    const map = useLeafletMap();
    useMapEvents({
      zoomend() { setCurrentZoom(map.getZoom()); },
    });
    return null;
  }

  const layerConfig = [
    { key: 'hospitals', label: 'Hospitals', icon: <FaHospital />, color: '#ef4444' },
    { key: 'schools', label: 'Schools', icon: <FaSchool />, color: '#3b82f6' },
    { key: 'parks', label: 'Parks', icon: <FaTree />, color: '#22c55e' },
    { key: 'mosques', label: 'Mosques', icon: <FaMosque />, color: '#a855f7' },
    { key: 'banks', label: 'Banks', icon: <BsBank />, color: '#eab308' },
    { key: 'police', label: 'Police', icon: <MdLocalPolice />, color: '#1e40af' },
    { key: 'pharmacies', label: 'Pharmacy', icon: <FaPills />, color: '#06b6d4' },
    { key: 'roads', label: 'Roads', icon: <Building2 />, color: '#f97316' },
    { key: 'coverageCircles', label: 'Coverage', icon: <Target />, color: '#0ea5e9' },
  ];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen pt-20 relative" style={{ background: '#0a0a0f' }}>
      {/* Search Bar */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search any area... (e.g. F-6 Islamabad, Lahore, New York)"
              className="w-full bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-3.5 pl-12 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 shadow-2xl"
              id="map-search-input"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
            )}
          </div>
        </form>
        {error && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            {error}
          </motion.div>
        )}
      </div>

      {/* Layer Toggle */}
      <div className="absolute top-24 right-4 z-[1000]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLayers(!showLayers)}
          className="p-3 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl text-white shadow-2xl"
        >
          <Layers className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {showLayers && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute top-14 right-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 w-52 shadow-2xl"
            >
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Map Layers</h4>
              {layerConfig.map((layer) => (
                <label
                  key={layer.key}
                  className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={layers[layer.key]}
                    onChange={() => toggleLayer(layer.key)}
                    className="w-4 h-4 rounded accent-cyan-500"
                  />
                  <span className="text-sm">{layer.icon}</span>
                  <span className="text-xs text-white/80">{layer.label}</span>
                  <span className="ml-auto text-[10px] text-white/30">
                    {layer.key === 'coverageCircles' ? '' : nearbyPlaces.filter((p) => {
                      if (layer.key === 'hospitals') return p.type === 'hospital' || p.type === 'clinic';
                      if (layer.key === 'schools') return p.type === 'school' || p.type === 'university';
                      if (layer.key === 'parks') return p.type === 'park' || p.type === 'playground';
                      if (layer.key === 'mosques') return p.type === 'mosque' || p.type === 'religious';
                      return p.type === layer.key.slice(0, -1);
                    }).length}
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="absolute top-1/2 right-0 z-[1000] p-2 bg-black/80 border border-white/10 rounded-l-xl text-white/60"
        style={{ display: showSidebar ? 'none' : 'block' }}
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
      </button>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Map Container */}
        <div className={`flex-1 relative transition-all duration-300 ${showSidebar ? 'mr-[380px]' : ''}`}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            style={{ background: '#0a0a0f' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onMapClick={handleMapClick} />
            <ZoomTracker />

            {/* Selected area circle — color-coded by score */}
            {selectedArea && (
              <Circle
                center={[selectedArea.lat, selectedArea.lng]}
                radius={5000}
                pathOptions={{
                  color: getAreaCircleColor(),
                  fillColor: getAreaCircleColor(),
                  fillOpacity: 0.06,
                  weight: 2,
                  dashArray: '8 4',
                }}
              />
            )}

            {/* Coverage circles for individual facilities */}
            {layers.coverageCircles && individualMarkers.map((place) => {
              const radius = COVERAGE_RADII[place.type];
              if (!radius || !place.lat || !place.lng) return null;
              const color = MARKER_COLORS[place.type] || '#6b7280';
              return (
                <Circle
                  key={`cov-${place.id}`}
                  center={[place.lat, place.lng]}
                  radius={radius}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.04, weight: 1, dashArray: '4 4' }}
                />
              );
            })}

            {/* Individual place markers (with animation via keys) */}
            {individualMarkers.map((place) => (
              place.lat && place.lng ? (
                <Marker
                  key={`${place.id}-${place.type}`}
                  position={[place.lat, place.lng]}
                  icon={createCustomIcon(place.type)}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13 }}>{place.name}</h3>
                      <p style={{ margin: '0 0 2px', color: '#666', fontSize: 11, textTransform: 'capitalize' }}>{place.type}</p>
                      {place.address && <p style={{ margin: '0 0 2px', color: '#888', fontSize: 10 }}>{place.address}</p>}
                      {place.distance > 0 && <p style={{ margin: '0', color: '#0ea5e9', fontSize: 11, fontWeight: 600 }}>{place.distance.toFixed(1)} km away</p>}
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}

            {/* Cluster markers */}
            {clusters.map((cluster, i) => (
              <Marker
                key={`cluster-${i}`}
                position={[cluster.lat, cluster.lng]}
                icon={createClusterIcon(cluster.count)}
              >
                <Popup>
                  <div style={{ minWidth: 120 }}>
                    <strong style={{ fontSize: 12 }}>{cluster.count} facilities</strong><br />
                    <span style={{ color: '#666', fontSize: 10 }}>Zoom in to see individual markers</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Road polylines */}
            {layers.roads && roads.map((road) => (
              road.geometry && road.geometry.length > 1 ? (
                <Polyline
                  key={road.id}
                  positions={road.geometry}
                  pathOptions={{
                    color: road.type === 'motorway' || road.type === 'trunk' ? '#f59e0b' :
                      road.type === 'primary' ? '#f97316' :
                        road.type === 'secondary' ? '#8b5cf6' : '#6b7280',
                    weight: road.type === 'motorway' ? 4 : road.type === 'primary' ? 3 : 2,
                    opacity: 0.7,
                  }}
                >
                  <Popup>
                    <div>
                      <strong style={{ fontSize: 12 }}>{road.name}</strong>
                      <br />
                      <span style={{ color: '#666', fontSize: 11 }}>{road.type} • {road.lanes} lanes</span>
                    </div>
                  </Popup>
                </Polyline>
              ) : null
            ))}
          </MapContainer>

          {/* Quick stats overlay bottom-left */}
          {nearbyPlaces.length > 0 && (
            <div className="absolute bottom-4 left-4 z-[1000]">
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex gap-4">
                {[
                  { icon: <FaHospital />, count: nearbyPlaces.filter((p) => p.type === 'hospital' || p.type === 'clinic').length, label: 'Hospitals' },
                  { icon: <FaSchool />, count: nearbyPlaces.filter((p) => p.type === 'school' || p.type === 'university').length, label: 'Schools' },
                  { icon: <FaTree />, count: nearbyPlaces.filter((p) => p.type === 'park').length, label: 'Parks' },
                  { icon: <FaMosque />, count: nearbyPlaces.filter((p) => p.type === 'mosque' || p.type === 'religious').length, label: 'Mosques' },
                ].map((s) => (
                  <div key={s.label} className="text-center flex flex-col items-center">
                    <div className="text-sm mb-1">{s.icon}</div>
                    <div className="text-lg font-bold">{s.count}</div>
                    <div className="text-[9px] text-white/40">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analysis Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-20 right-0 w-[380px] h-[calc(100vh-5rem)] bg-black/90 backdrop-blur-xl border-l border-white/10 z-[999] overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    Area Analysis
                  </h2>
                  <button onClick={() => setShowSidebar(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                {!selectedArea && !loading && (
                  <div className="text-center py-12">
                    <Navigation2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/40">Search for an area or click on the map to start analysis</p>
                  </div>
                )}

                {loading && (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-white/40">Analyzing area...</p>
                    <p className="text-xs text-white/20 mt-1">Fetching real-time data from OpenStreetMap</p>
                  </div>
                )}

                {analysis && !loading && (
                  <div className="space-y-3">
                    {/* Area Name */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-xs text-white/40 mb-1">Selected Area</p>
                      <p className="text-sm font-medium text-white/90 line-clamp-2">{selectedArea?.displayName || 'Unknown'}</p>
                    </div>

                    {/* Score — collapsible */}
                    <div className={`rounded-xl border overflow-hidden transition-all ${analysis.score >= 70 ? 'bg-green-500/5 border-green-500/20' :
                        analysis.score >= 50 ? 'bg-yellow-500/5 border-yellow-500/20' :
                          'bg-red-500/5 border-red-500/20'
                      }`}>
                      <button onClick={() => toggleSection('score')} className="w-full p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl font-bold">{analysis.score}<span className="text-sm text-white/40">/100</span></div>
                          <div className={`text-xs px-2 py-0.5 rounded-full ${analysis.score >= 70 ? 'bg-green-500/20 text-green-400' :
                              analysis.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>{analysis.rating}</div>
                        </div>
                        {expandedSection === 'score' ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                      </button>
                      {expandedSection === 'score' && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-4 pb-4">
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${analysis.score}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={`h-full rounded-full ${analysis.score >= 70 ? 'bg-green-500' :
                                  analysis.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            />
                          </div>
                          {/* Score breakdown */}
                          {analysis.scoring && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white/5 rounded-lg p-2">
                                <span className="text-white/40">Roads</span>
                                <div className="font-bold">{analysis.scoring.roadScore}/100</div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2">
                                <span className="text-white/40">Diversity</span>
                                <div className="font-bold">{analysis.scoring.diversityScore}/100</div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Strengths */}
                    {analysis.strengths && analysis.strengths.length > 0 && (
                      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <button onClick={() => toggleSection('strengths')} className="w-full p-3 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Strengths ({analysis.strengths.length})
                          </h4>
                          {expandedSection === 'strengths' ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                        </button>
                        {expandedSection === 'strengths' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 space-y-1.5">
                            {analysis.strengths.map((s, i) => (
                              <div key={i} className="text-xs p-2.5 rounded-lg bg-green-500/5 border border-green-500/15 text-green-300">
                                <span className="mr-1">{s.icon}</span> {s.message}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Weaknesses */}
                    {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <button onClick={() => toggleSection('weaknesses')} className="w-full p-3 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Weaknesses ({analysis.weaknesses.length})
                          </h4>
                          {expandedSection === 'weaknesses' ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                        </button>
                        {expandedSection === 'weaknesses' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 space-y-1.5">
                            {analysis.weaknesses.map((w, i) => (
                              <div key={i} className={`text-xs p-2.5 rounded-lg border ${w.severity === 'critical' ? 'bg-red-500/5 border-red-500/15 text-red-300' : 'bg-amber-500/5 border-amber-500/15 text-amber-300'
                                }`}>
                                <span className="mr-1">{w.icon}</span> {w.message}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Coverage */}
                    {analysis.coverage && (
                      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <button onClick={() => toggleSection('coverage')} className="w-full p-3 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-cyan-400" /> Coverage
                          </h4>
                          {expandedSection === 'coverage' ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                        </button>
                        {expandedSection === 'coverage' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 space-y-1.5">
                            {Object.entries(analysis.coverage).slice(0, 10).map(([type, cov]) => (
                              <div key={type} className="flex items-center justify-between text-xs py-1">
                                <span className="capitalize text-white/70">{type.replace('_', ' ')}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white/40">{cov.count}</span>
                                  {cov.score !== undefined && (
                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${cov.score >= 70 ? 'bg-green-400' : cov.score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                                        }`} style={{ width: `${cov.score}%` }} />
                                    </div>
                                  )}
                                  <span className={`w-2 h-2 rounded-full ${cov.status === 'excellent' || cov.status === 'good' ? 'bg-green-400' :
                                      cov.status === 'poor' ? 'bg-yellow-400' : 'bg-red-400'
                                    }`} />
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <button onClick={() => toggleSection('recommendations')} className="w-full p-3 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" /> Recommendations ({analysis.recommendations.length})
                          </h4>
                          {expandedSection === 'recommendations' ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                        </button>
                        {expandedSection === 'recommendations' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 space-y-1.5">
                            {analysis.recommendations.map((rec, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`text-xs p-2.5 rounded-lg border ${rec.priority === 'critical' ? 'bg-red-500/5 border-red-500/15 text-red-300' :
                                    rec.priority === 'high' ? 'bg-amber-500/5 border-amber-500/15 text-amber-300' :
                                      'bg-blue-500/5 border-blue-500/15 text-blue-300'
                                  }`}
                              >
                                <span className="mr-1">{rec.icon}</span> {rec.message}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Density */}
                    {analysis.density && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Density</h4>
                        <p className="text-lg font-bold">{analysis.density.placesPerSqKm} <span className="text-xs text-white/40">facilities/km²</span></p>
                        <p className="text-[10px] text-white/30 mt-1">Total: {analysis.totalPlaces} places within 5km</p>
                      </div>
                    )}

                    {/* Nearby Places List */}
                    {nearbyPlaces.length > 0 && (
                      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <button onClick={() => toggleSection('places')} className="w-full p-3 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">
                            Nearby ({nearbyPlaces.length})
                          </h4>
                          {expandedSection === 'places' ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                        </button>
                        {expandedSection === 'places' && (
                          <div className="px-3 pb-3 space-y-1 max-h-60 overflow-y-auto">
                            {nearbyPlaces.slice(0, 20).map((place, i) => (
                              <div key={`${place.id}-${i}`} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="flex-shrink-0 text-sm">{MARKER_ICONS[place.type] || <FaMapMarkerAlt />}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-white/80">{place.name}</p>
                                  <p className="text-white/30 capitalize">{place.type}</p>
                                </div>
                                <span className="text-cyan-400 flex-shrink-0">{place.distance?.toFixed(1)}km</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Download Report */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownloadReport}
                      disabled={generating}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                    >
                      {generating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : (
                        <><FileDown className="w-4 h-4" /> Download Report (PDF)</>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
