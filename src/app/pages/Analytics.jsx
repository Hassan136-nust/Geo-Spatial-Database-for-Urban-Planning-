import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GlassPanel } from '../components/GlassPanel';
import { BarChart3, AlertTriangle, Shield, TrendingUp, Stethoscope, GraduationCap, Trees, Search, Loader2, FileDown, MapPin, CheckCircle, Zap, Target, ChevronRight } from 'lucide-react';
import mapsApi from '../services/mapsApi';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function ClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

const statusColors = {
  excellent: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
  good: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  poor: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  missing: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
};

const typeIcons = {
  hospital: { icon: Stethoscope, color: 'text-red-400' },
  school: { icon: GraduationCap, color: 'text-blue-400' },
  university: { icon: GraduationCap, color: 'text-indigo-400' },
  park: { icon: Trees, color: 'text-green-400' },
  pharmacy: { icon: Shield, color: 'text-cyan-400' },
  police: { icon: Shield, color: 'text-blue-600' },
  bank: { icon: TrendingUp, color: 'text-yellow-400' },
  mosque: { icon: MapPin, color: 'text-purple-400' },
  fire_station: { icon: AlertTriangle, color: 'text-red-500' },
  mall: { icon: BarChart3, color: 'text-pink-400' },
};

export function Analytics() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [generating, setGenerating] = useState(false);

  const analyzePoint = useCallback(async (lat, lng, name = 'Selected Area') => {
    setLoading(true);
    setSelectedPoint({ lat, lng });
    setAreaName(name);
    try {
      const result = await mapsApi.analyzeArea(lat, lng, 5000, name);
      setAnalysis(result.data?.analysis || null);
      setPlaces(result.data?.places || []);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!searchInput.trim()) return;
    try {
      setLoading(true);
      const searchResult = await mapsApi.searchArea(searchInput.trim());
      if (searchResult.data?.length > 0) {
        const area = searchResult.data[0];
        await analyzePoint(area.lat, area.lng, area.displayName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchInput, analyzePoint]);

  const handleMapClick = useCallback(async (lat, lng) => {
    try {
      const rev = await mapsApi.reverse(lat, lng);
      await analyzePoint(lat, lng, rev.data?.displayName || 'Selected Point');
    } catch {
      await analyzePoint(lat, lng);
    }
  }, [analyzePoint]);

  const handleDownloadReport = useCallback(async () => {
    if (!selectedPoint) return;
    setGenerating(true);
    try {
      const blob = await mapsApi.generateReport(selectedPoint.lat, selectedPoint.lng, 5000, areaName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UrbanPulse_Report_${areaName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setGenerating(false);
    }
  }, [selectedPoint, areaName]);

  const coverageEntries = analysis?.coverage ? Object.entries(analysis.coverage) : [];
  const getAreaCircleColor = () => {
    if (!analysis) return '#a855f7';
    if (analysis.score >= 70) return '#22c55e';
    if (analysis.score >= 50) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-lg text-white/50">Search any area or click the map to analyze infrastructure coverage</p>
        </motion.div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-xl">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search area to analyze... (e.g. G-9 Islamabad, Karachi)"
              className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-3.5 pl-12 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />}
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mini Map */}
          <GlassPanel delay={0.1}>
            <div className="p-2 h-80 rounded-2xl overflow-hidden">
              <MapContainer center={[33.6844, 73.0479]} zoom={12} className="h-full w-full rounded-xl" zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <ClickHandler onClick={handleMapClick} />
                {selectedPoint && (
                  <>
                    <Marker position={[selectedPoint.lat, selectedPoint.lng]} />
                    <Circle center={[selectedPoint.lat, selectedPoint.lng]} radius={5000}
                      pathOptions={{ color: getAreaCircleColor(), fillColor: getAreaCircleColor(), fillOpacity: 0.06, weight: 2, dashArray: '8 4' }}
                    />
                  </>
                )}
              </MapContainer>
            </div>
          </GlassPanel>

          {/* Score Card */}
          <GlassPanel delay={0.2}>
            <div className="p-6 flex flex-col justify-center h-80">
              {!analysis && !loading && (
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-white/15 mx-auto mb-3" />
                  <p className="text-sm text-white/40">Search or click the map to analyze an area</p>
                </div>
              )}
              {loading && (
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-purple-400 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-white/40">Fetching real-time data...</p>
                  <p className="text-xs text-white/20 mt-1">Analyzing infrastructure from OpenStreetMap</p>
                </div>
              )}
              {analysis && !loading && (
                <>
                  <p className="text-xs text-white/40 mb-1">Analysis for</p>
                  <h3 className="text-sm font-medium text-white/80 mb-4 line-clamp-2">{areaName}</h3>

                  <div className="flex items-end gap-3 mb-4">
                    <span className={`text-6xl font-bold ${
                      analysis.score >= 70 ? 'text-green-400' :
                      analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{analysis.score}</span>
                    <span className="text-lg text-white/30 pb-2">/100</span>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${
                    analysis.score >= 70 ? 'bg-green-500/10 text-green-400' :
                    analysis.score >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {analysis.score >= 70 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {analysis.rating}
                  </div>

                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.score}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        analysis.score >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                        analysis.score >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                        'bg-gradient-to-r from-red-500 to-orange-400'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-white/30 mt-2">{analysis.totalPlaces} facilities within 5km radius</p>

                  {/* Score breakdown */}
                  {analysis.scoring && (
                    <div className="flex gap-3 mt-3">
                      <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[9px] text-white/40">Roads</div>
                        <div className="text-sm font-bold">{analysis.scoring.roadScore}</div>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[9px] text-white/40">Diversity</div>
                        <div className="text-sm font-bold">{analysis.scoring.diversityScore}</div>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[9px] text-white/40">Penalties</div>
                        <div className="text-sm font-bold text-red-400">{analysis.scoring.penalties?.length || 0}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </GlassPanel>
        </div>

        {/* Strengths */}
        {analysis && analysis.strengths && analysis.strengths.length > 0 && (
          <>
            <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" /> Strengths
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {analysis.strengths.map((s, i) => (
                <GlassPanel key={i} delay={0.05 * i}>
                  <div className="p-4 bg-green-500/5 border border-green-500/15 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-sm font-semibold capitalize text-green-300">{s.type?.replace('_', ' ')}</span>
                      {s.score !== undefined && (
                        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">{s.score}/100</span>
                      )}
                    </div>
                    <p className="text-xs text-white/70">{s.message}</p>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </>
        )}

        {/* Weaknesses */}
        {analysis && analysis.weaknesses && analysis.weaknesses.length > 0 && (
          <>
            <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Weaknesses
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {analysis.weaknesses.map((w, i) => (
                <GlassPanel key={i} delay={0.05 * i}>
                  <div className={`p-4 rounded-2xl border ${
                    w.severity === 'critical' ? 'bg-red-500/5 border-red-500/15' : 'bg-amber-500/5 border-amber-500/15'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{w.icon}</span>
                      <span className={`text-sm font-semibold capitalize ${
                        w.severity === 'critical' ? 'text-red-300' : 'text-amber-300'
                      }`}>{w.type?.replace('_', ' ')}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                        w.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{(w.severity || 'warning').toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-white/70">{w.message}</p>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </>
        )}

        {/* Coverage Grid */}
        {analysis && coverageEntries.length > 0 && (
          <>
            <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" /> Coverage by Category
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {coverageEntries.map(([type, cov], i) => {
                const st = statusColors[cov.status] || statusColors.missing;
                const typeInfo = typeIcons[type];
                const Icon = typeInfo?.icon || MapPin;
                return (
                  <GlassPanel key={type} delay={0.05 * i}>
                    <div className={`p-4 ${st.bg} border ${st.border} rounded-2xl`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${typeInfo?.color || 'text-white/50'}`} />
                          <span className="text-sm font-semibold capitalize">{type.replace('_', ' ')}</span>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                      </div>
                      <div className="text-2xl font-bold mb-1">{cov.count}</div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-white/40">found</span>
                        <span className={st.text}>{cov.nearest ? `${cov.nearest.toFixed(1)}km nearest` : 'none'}</span>
                      </div>
                      {/* Score bar */}
                      {cov.score !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-white/40">Score</span>
                            <span className={st.text}>{cov.score}/100</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${cov.score}%` }}
                              transition={{ duration: 0.8, delay: 0.1 * i }}
                              className={`h-full rounded-full ${
                                cov.score >= 70 ? 'bg-green-400' : cov.score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                      {cov.status && (
                        <div className={`mt-2 text-[10px] ${st.text} capitalize`}>Status: {cov.status}</div>
                      )}
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          </>
        )}

        {/* Recommendations */}
        {analysis && analysis.recommendations && analysis.recommendations.length > 0 && (
          <GlassPanel delay={0.4}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className={`p-4 rounded-xl border ${
                      rec.priority === 'critical' ? 'bg-red-500/5 border-red-500/15' :
                      rec.priority === 'high' ? 'bg-amber-500/5 border-amber-500/15' :
                      rec.priority === 'medium' ? 'bg-blue-500/5 border-blue-500/15' :
                      'bg-green-500/5 border-green-500/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{rec.icon}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        rec.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                        rec.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>{(rec.priority || 'medium').toUpperCase()}</span>
                      <span className="text-xs text-white/40 capitalize">{rec.category}</span>
                    </div>
                    <p className="text-xs text-white/70 mt-1">{rec.message}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassPanel>
        )}

        {/* Gaps */}
        {analysis && analysis.gaps && analysis.gaps.length > 0 && (
          <GlassPanel delay={0.5}>
            <div className="p-6 mt-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Infrastructure Gaps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.gaps.map((gap, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className={`p-4 rounded-xl border ${
                      gap.severity === 'critical' ? 'bg-red-500/5 border-red-500/15' : 'bg-amber-500/5 border-amber-500/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        gap.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{gap.severity.toUpperCase()}</span>
                      <span className="text-xs text-white/40 capitalize">{gap.type}</span>
                    </div>
                    <p className="text-xs text-white/70 mt-1">{gap.message}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassPanel>
        )}

        {analysis && analysis.gaps && analysis.gaps.length === 0 && (
          <GlassPanel delay={0.4}>
            <div className="p-8 text-center mt-6">
              <Shield className="w-12 h-12 mx-auto mb-3 text-green-400/40" />
              <p className="text-sm text-white/50">All infrastructure categories have adequate coverage!</p>
            </div>
          </GlassPanel>
        )}

        {/* Download Report */}
        {analysis && (
          <div className="mt-8 text-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadReport}
              disabled={generating}
              className="px-8 py-3.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Report...</>
              ) : (
                <><FileDown className="w-4 h-4" /> Generate Urban Planning Report (PDF)</>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
