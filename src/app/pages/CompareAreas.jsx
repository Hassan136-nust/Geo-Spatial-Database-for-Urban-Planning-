import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { GitCompare, Plus, Trash2, Loader2, Trophy, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';

export function CompareAreas() {
  const { user } = useAuth();
  const [comparisons, setComparisons] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [compName, setCompName] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedComp, setExpandedComp] = useState(null);

  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

  const formatChartData = (comp) => {
    if (!comp.comparison_metrics) return [];
    const categories = [
      { key: 'healthcare', label: 'Healthcare' },
      { key: 'education', label: 'Education' },
      { key: 'green_space', label: 'Parks' },
      { key: 'safety', label: 'Safety' },
    ];
    return categories.map(cat => {
      const dataPoint = { subject: cat.label };
      comp.areas.forEach(area => {
        dataPoint[area.area_name] = comp.comparison_metrics[cat.key]?.[area.area_name]?.score || 0;
      });
      return dataPoint;
    });
  };

  useEffect(() => {
    if (user) { loadComparisons(); loadAreas(); }
  }, [user]);

  const loadComparisons = async () => {
    try {
      const res = await mapsApi.getComparisons(); setComparisons(res.data || []);
    } catch (err) { console.error(err); }
  };
  const loadAreas = async () => {
    try {
      setLoading(true);
      const res = await mapsApi.getAreaHistory(); setAreas(res.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const toggleArea = (id) => {
    setSelectedAreas((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const handleCompare = async () => {
    if (selectedAreas.length < 2) return;
    setCreating(true);
    try {
      const res = await mapsApi.createComparison(selectedAreas, compName);
      setComparisons([res.data, ...comparisons]);
      setSelectedAreas([]); setCompName('');
    } catch (err) { console.error(err); } finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this comparison?')) return;
    try { await mapsApi.deleteComparison(id); setComparisons(comparisons.filter((c) => c._id !== id)); } catch (err) { console.error(err); }
  };

  if (!user) return <div className="min-h-screen pt-28 pb-20 px-8 text-center"><p className="text-white/50">Please login</p></div>;

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">Compare Areas</h1>
          <p className="text-white/50 mt-2">Side-by-side analysis of multiple areas</p>
        </motion.div>

        {/* Create Comparison */}
        <GlassPanel>
          <div className="p-6">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">New Comparison</h3>
            <input value={compName} onChange={(e) => setCompName(e.target.value)} placeholder="Comparison name (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-teal-500/50" />
            {areas.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {areas.slice(0, 10).map((area) => (
                  <button key={area._id} onClick={() => toggleArea(area._id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${selectedAreas.includes(area._id) ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                    {area.area_name} {area.last_analysis_score != null && `(${area.last_analysis_score})`}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/30 mb-4">Search areas on the Dashboard first to compare them.</p>
            )}
            <button onClick={handleCompare} disabled={selectedAreas.length < 2 || selectedAreas.length > 4 || creating} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />} Compare ({selectedAreas.length} selected) {selectedAreas.length > 4 && "(Max 4)"}
            </button>
          </div>
        </GlassPanel>

        {/* Existing Comparisons */}
        {loading ? (
          <div className="text-center py-10"><Loader2 className="w-6 h-6 text-teal-400 mx-auto animate-spin" /></div>
        ) : comparisons.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider">Previous Comparisons</h3>
            {comparisons.map((comp) => (
              <GlassPanel key={comp._id}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white/90">{comp.name}</h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedComp(expandedComp === comp._id ? null : comp._id)} className="text-white/40 hover:bg-white/10 p-1 rounded">
                        {expandedComp === comp._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(comp._id)} className="text-red-400 hover:bg-red-500/10 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {comp.areas?.map((area, idx) => (
                      <div key={area.area_id} className={`p-3 rounded-xl border relative overflow-hidden ${area.area_id === comp.winner_area_id?.toString() ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <div className="flex items-center gap-1 mb-1 pl-2">
                          {area.area_id === comp.winner_area_id?.toString() && <Trophy className="w-3 h-3 text-amber-400" />}
                          <p className="text-xs font-medium truncate">{area.area_name}</p>
                        </div>
                        <p className={`text-2xl font-bold pl-2 ${area.score >= 70 ? 'text-green-400' : area.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{area.score}</p>
                      </div>
                    ))}
                  </div>

                  {/* Explainability & Charts */}
                  <AnimatePresence>
                    {expandedComp === comp._id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 pt-4 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Radar Chart */}
                          <div className="h-64 bg-black/40 rounded-xl border border-white/5 p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formatChartData(comp)}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                {comp.areas?.map((area, idx) => (
                                  <Radar key={area.area_id} name={area.area_name} dataKey={area.area_name} stroke={CHART_COLORS[idx % CHART_COLORS.length]} fill={CHART_COLORS[idx % CHART_COLORS.length]} fillOpacity={0.3} />
                                ))}
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Notes / Explainability */}
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 text-sm text-white/70">
                            <h5 className="font-semibold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-400" /> Comparison Insights</h5>
                            <p className="text-xs">
                              {comp.winner_area_id ? `The area winning the overall evaluation is ${comp.areas.find(a => a.area_id === comp.winner_area_id?.toString())?.area_name || 'unknown'}. ` : ''}
                              Scores are calculated based on accessibility to healthcare, education, parks, and safety facilities.
                            </p>
                            {comp.notes && (
                              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs">
                                <strong>Notes:</strong> {comp.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
