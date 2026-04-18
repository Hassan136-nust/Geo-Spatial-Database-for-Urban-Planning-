import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { GlassPanel } from '../components/GlassPanel';
import { Map, Search, Loader2, Save, Trash2, X, Download, ChevronDown, ChevronUp, MapPin, Layers, Database, CheckCircle2 } from 'lucide-react';
import mapsApi from '../services/mapsApi';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

const ZONE_COLORS = {
  residential: '#3b82f6',
  commercial: '#f59e0b',
  industrial: '#ef4444',
  green: '#22c55e',
  institutional: '#8b5cf6',
  mixed: '#06b6d4',
  administrative: '#64748b',
};

// Component to fly the map to a location
function FlyToLocation({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 12, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export function Zones() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [fetchingOSM, setFetchingOSM] = useState(false);
  const [osmZones, setOsmZones] = useState([]);
  const [savedZones, setSavedZones] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [mapCenter, setMapCenter] = useState([33.6844, 73.0479]);
  const [mapZoom, setMapZoom] = useState(12);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('osm'); // 'osm' | 'saved'
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  // Load saved zones on mount
  useEffect(() => {
    loadSavedZones();
  }, []);

  const loadSavedZones = async () => {
    try {
      setLoadingSaved(true);
      const res = await mapsApi.getZones();
      setSavedZones(res.data || []);
    } catch (err) {
      console.error('Failed to load saved zones:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await mapsApi.searchArea(searchQuery);
      if (res.data && res.data.length > 0) {
        const place = res.data[0];
        setMapCenter([place.lat, place.lng]);
        setMapZoom(12);
        showToast('success', `Found: ${place.displayName.split(',')[0]}`);
        // Auto-fetch OSM zones for this location with slightly smaller radius to get city specific
        fetchOSMZonesForLocation(place.lat, place.lng);
      } else {
        showToast('warning', 'No results found');
      }
    } catch (err) {
      showToast('error', 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const fetchOSMZonesForLocation = useCallback(async (lat, lng) => {
    setFetchingOSM(true);
    try {
      const res = await mapsApi.fetchOSMZones(lat, lng, 12000);
      setOsmZones(res.data || []);
      setActiveTab('osm');
      if ((res.data || []).length === 0) {
        showToast('info', 'No major zones found in this area');
      } else {
        showToast('success', `Found ${res.data.length} major zones`);
      }
    } catch (err) {
      console.error('OSM fetch error:', err);
      showToast('error', 'Failed to fetch OSM zones');
    } finally {
      setFetchingOSM(false);
    }
  }, []);

  const handleSaveZone = useCallback(async (zone, isBulk = false) => {
    if (!user && !isBulk) {
      showToast('warning', 'Please login to save zones');
      return false;
    }
    if (!isBulk) setSavingId(zone.osm_id);
    try {
      await mapsApi.saveOSMZone({
        osm_id: zone.osm_id,
        name: zone.name,
        zone_type: zone.zone_type,
        geometry: zone.geometry,
        center: zone.center,
        area_sqkm: zone.area_sqkm,
        admin_level: zone.admin_level,
        description: zone.description,
      });
      if (!isBulk) showToast('success', `"${zone.name}" saved to database`);
      
      setOsmZones(prev => prev.map(z =>
        z.osm_id === zone.osm_id ? { ...z, alreadySaved: true } : z
      ));
      if (!isBulk) loadSavedZones();
      return true;
    } catch (err) {
      if (err.status === 409) {
        if (!isBulk) showToast('info', 'Zone already saved');
        setOsmZones(prev => prev.map(z =>
          z.osm_id === zone.osm_id ? { ...z, alreadySaved: true } : z
        ));
        return true;
      } else {
        if (!isBulk) showToast('error', 'Failed to save zone');
        return false;
      }
    } finally {
      if (!isBulk) setSavingId(null);
    }
  }, [user]);

  const handleSaveAll = async () => {
    if (!user) {
      showToast('warning', 'Please login to save zones');
      return;
    }
    const unsavedZones = osmZones.filter(z => !z.alreadySaved);
    if (unsavedZones.length === 0) {
      showToast('info', 'All zones are already saved');
      return;
    }

    setSavingAll(true);
    let savedCount = 0;
    for (const zone of unsavedZones) {
      const success = await handleSaveZone(zone, true);
      if (success) savedCount++;
    }
    
    setSavingAll(false);
    showToast('success', `Successfully saved ${savedCount} zones`);
    loadSavedZones();
  };

  const handleDeleteZone = useCallback(async (id) => {
    if (!confirm('Delete this zone?')) return;
    try {
      await mapsApi.deleteZone(id);
      setSavedZones(prev => prev.filter(z => z._id !== id));
      // Re-check OSM zones and mark as unsaved
      setOsmZones(prev => prev.map(z => 
        (z._id === id || (z.alreadySaved && !savedZones.find(sz => sz._id !== id && sz.osm_id === z.osm_id))) 
          ? { ...z, alreadySaved: false } : z
      ));
      showToast('success', 'Zone deleted');
    } catch (err) {
      showToast('error', 'Failed to delete zone');
    }
  }, [savedZones]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Convert GeoJSON coordinates to Leaflet polygon positions
  const toLeafletPositions = (geometry) => {
    if (!geometry || !geometry.coordinates) return [];
    try {
      const coords = geometry.coordinates[0];
      if (!coords) return [];
      return coords.map(c => [c[1], c[0]]); // GeoJSON is [lng, lat], Leaflet is [lat, lng]
    } catch {
      return [];
    }
  };

  const displayZones = useMemo(() => {
    if (activeTab === 'osm') return osmZones;
    return savedZones.filter(z => z.geometry && z.geometry.coordinates);
  }, [activeTab, osmZones, savedZones]);

  return (
    <div className="h-screen pt-16 relative flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -30, x: '-50%' }}
            className={`fixed top-24 left-1/2 z-[2000] px-5 py-3 rounded-2xl text-sm font-medium backdrop-blur-xl border shadow-2xl ${
              toast.type === 'success' ? 'bg-green-500/15 border-green-500/30 text-green-300' :
              toast.type === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
              toast.type === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-300' :
              'bg-blue-500/15 border-blue-500/30 text-blue-300'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Search Bar (Top Left) */}
      <div className="absolute top-20 left-4 z-[1000] w-80">
        <GlassPanel>
          <div className="p-3 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search city for major zones..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center min-w-[3rem]"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          {fetchingOSM && (
            <div className="px-4 pb-3 text-xs text-cyan-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching major city zones...
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full"
          style={{ background: '#0a0a0f' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FlyToLocation center={mapCenter} zoom={mapZoom} />

          {/* Render zone polygons */}
          {displayZones.map((zone) => {
            const positions = toLeafletPositions(zone.geometry);
            if (positions.length < 3) return null;
            const color = ZONE_COLORS[zone.zone_type] || ZONE_COLORS.administrative;
            const zoneId = zone._id || zone.osm_id;
            const isSelected = selectedZone === zoneId;

            return (
              <Polygon
                key={zoneId}
                positions={positions}
                pathOptions={{
                  color: isSelected ? '#fff' : color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.4 : 0.15,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedZone(isSelected ? null : zoneId);
                    setMapCenter([zone.center.lat, zone.center.lng]);
                  },
                }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13 }}>{zone.name}</h3>
                    <p style={{ margin: '0 0 4px', color: '#888', fontSize: 11 }}>
                      <strong style={{ color, textTransform: 'capitalize' }}>{zone.zone_type}</strong>
                    </p>
                    {zone.area_sqkm > 0 && (
                      <p style={{ margin: '0 0 6px', color: '#888', fontSize: 11 }}>
                        Area: {zone.area_sqkm} km²
                      </p>
                    )}
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      {/* Bottom Tiles UI */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] flex flex-col gap-2">
        
        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
            <button
              onClick={() => setActiveTab('osm')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'osm' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Live OSM ({osmZones.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'saved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> Saved DB ({savedZones.length})
            </button>
          </div>

          {activeTab === 'osm' && osmZones.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={savingAll || osmZones.every(z => z.alreadySaved)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl text-xs font-bold text-white shadow-lg border border-white/10 disabled:opacity-50 flex items-center gap-2 hover:shadow-cyan-500/20 transition-all"
            >
              {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All to DB
            </button>
          )}
        </div>

        {/* Horizontal Tiles Container */}
        <div className="w-full bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-4 overflow-x-auto">
          {displayZones.length === 0 ? (
            <div className="py-6 text-center text-white/40 flex flex-col items-center justify-center">
              {activeTab === 'osm' ? (
                <>
                  <MapPin className="w-6 h-6 mb-2 opacity-50" />
                  <p className="text-sm">Search a city to fetch major zones</p>
                </>
              ) : loadingSaved ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              ) : (
                <>
                  <Database className="w-6 h-6 mb-2 opacity-50" />
                  <p className="text-sm">No zones saved in database yet</p>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-4">
              {displayZones.map((zone, idx) => {
                const zoneId = zone._id || zone.osm_id;
                const color = ZONE_COLORS[zone.zone_type] || ZONE_COLORS.administrative;
                const isSelected = selectedZone === zoneId;

                return (
                  <motion.div
                    key={zoneId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedZone(isSelected ? null : zoneId);
                      if (zone.center) {
                        setMapCenter([zone.center.lat, zone.center.lng]);
                        setMapZoom(13);
                      }
                    }}
                    className={`shrink-0 w-64 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white/10 border-white/30 shadow-lg' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ backgroundColor: color + '20', color }}>
                          {zone.zone_type}
                        </span>
                      </div>
                      
                      {/* Action Button */}
                      {activeTab === 'osm' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSaveZone(zone); }}
                          disabled={zone.alreadySaved || savingId === zone.osm_id}
                          className={`p-1.5 rounded-lg text-xs transition-colors border ${
                            zone.alreadySaved
                              ? 'bg-green-500/10 border-green-500/20 text-green-400 cursor-default'
                              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                          }`}
                          title={zone.alreadySaved ? 'Already saved' : 'Save to DB'}
                        >
                          {savingId === zone.osm_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : zone.alreadySaved ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        user && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone._id); }}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Delete from DB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                    
                    <h4 className="text-sm font-semibold text-white/90 truncate mb-1" title={zone.name}>{zone.name}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-white/50">
                      {zone.area_sqkm > 0 && <span>{zone.area_sqkm} km²</span>}
                      {zone.admin_level && <span>Level {zone.admin_level}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
