import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { GitCompare, Plus, Trash2, Loader2, Trophy, BarChart3, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
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
  const [toast, setToast] = useState(null);

  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

  const formatChartData = (comp) => {
    if (!comp.comparison_metrics) return [];
    const categories = [
      { key: 'healthcare', label: 'Healthcare' },
      { key: 'education', label: 'Education' },
      { key: 'green_space', label: 'Parks' },
      { key: 'safety', label: 'Safety' },
      { key: 'connectivity', label: 'Connectivity' }
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

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadComparisons = async () => {
    try {
      const res = await mapsApi.getComparisons(); 
      setComparisons(res.data || []);
    } catch (err) { console.error(err); }
  };
  
  const loadAreas = async () => {
    try {
      setLoading(true);
      const res = await mapsApi.getAreaHistory(); 
      setAreas(res.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const toggleArea = (id) => {
    if (selectedAreas.includes(id)) {
      setSelectedAreas(selectedAreas.filter((a) => a !== id));
    } else {
      if (selectedAreas.length >= 4) {
        showToast('warning', 'You can only compare up to 4 areas at a time');
        return;
      }
      setSelectedAreas([...selectedAreas, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedAreas.length < 2) return;
    const uniqueAreas = new Set(selectedAreas);
    if (uniqueAreas.size !== selectedAreas.length) {
      showToast('error', 'Cannot select the same area twice');
      return;
    }
    setCreating(true);
    try {
      const res = await mapsApi.createComparison(selectedAreas, compName);
      setComparisons([res.data, ...comparisons]);
      setSelectedAreas([]); 
      setCompName('');
      setExpandedComp(res.data._id);
      showToast('success', 'Comparison generated successfully');
    } catch (err) { 
      console.error(err); 
      showToast('error', err.response?.data?.message || 'Failed to generate comparison');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this comparison?')) return;
    try { 
      await mapsApi.deleteComparison(id); 
      setComparisons(comparisons.filter((c) => c._id !== id)); 
    } catch (err) { console.error(err); }
  };

  if (!user) return <div className="min-h-screen pt-28 pb-20 px-8 text-center"><p className="text-gray-900/50">Please login</p></div>;

  return (
    <div 
      className="min-h-screen pt-28 pb-20 px-8 relative"
      style={{
        backgroundImage: 'url(https://www.economist.com/cdn-cgi/image/width=1920,quality=95,format=auto/content-assets/images/20241221_STP001.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80" />
      
      <div className="relative z-10">
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
                'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">Compare Areas</h1>
            <p className="text-gray-900/50 mt-2">Side-by-side analysis of multiple areas</p>
          </motion.div>

          {/* Create Comparison */}
          <GlassPanel>
            <div className="p-6">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">New Comparison</h3>
              <input 
                value={compName} 
                onChange={(e) => setCompName(e.target.value)} 
                placeholder="Comparison name (optional)" 
                className="w-full bg-white/5 border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-teal-500/50" 
              />
              {areas.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {areas.slice(0, 10).map((area) => (
                    <button 
                      key={area._id} 
                      onClick={() => toggleArea(area._id)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-300 ${selectedAreas.includes(area._id) ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.3)]' : 'bg-white/5 border-gray-200 text-gray-900/50 hover:bg-white/10'}`}>
                      {area.area_name} {area.last_analysis_score != null && `(${area.last_analysis_score})`}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-4">Search areas on the Dashboard first to compare them.</p>
              )}
              <button 
                onClick={handleCompare} 
                disabled={selectedAreas.length < 2 || selectedAreas.length > 4 || creating} 
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />} 
                Compare ({selectedAreas.length} selected) {selectedAreas.length > 4 && "(Max 4)"}
              </button>
            </div>
          </GlassPanel>

          {/* Existing Comparisons */}
          {loading ? (
            <div className="text-center py-10"><Loader2 className="w-6 h-6 text-teal-400 mx-auto animate-spin" /></div>
          ) : comparisons.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Previous Comparisons</h3>
              {comparisons.map((comp) => (
                <GlassPanel key={comp._id}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900/90">{comp.name}</h4>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setExpandedComp(expandedComp === comp._id ? null : comp._id)} 
                          className="text-gray-500 hover:bg-white/10 p-1 rounded">
                          {expandedComp === comp._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(comp._id)} 
                          className="text-red-400 hover:bg-red-500/10 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {comp.areas?.map((area, idx) => (
                        <div 
                          key={area.area_id} 
                          className={`p-3 rounded-xl border relative overflow-hidden transition-all duration-300 ${area.area_id === comp.winner_area_id?.toString() ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-gray-200'}`}>
                          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                          <div className="flex items-center gap-1 mb-1 pl-2">
                            {area.area_id === comp.winner_area_id?.toString() && <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />}
                            <p className="text-xs font-medium truncate">{area.area_name}</p>
                          </div>
                          <p className={`text-2xl font-bold pl-2 ${area.score >= 70 ? 'text-green-400' : area.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{area.score}</p>
                        </div>
                      ))}
                    </div>

                    {/* Explainability & Charts */}
                    <AnimatePresence>
                      {expandedComp === comp._id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="overflow-hidden border-t border-gray-200 pt-4 mt-2">
                          
                          {/* Winner Explanation */}
                          {comp.winner_explanation && (
                            <div className="mb-4 p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-xl text-sm text-emerald-100">
                              <h5 className="font-bold flex items-center gap-2 mb-1">
                                <Trophy className="w-4 h-4 text-emerald-400" /> Final Verdict
                              </h5>
                              <p>{comp.winner_explanation}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            {/* Radar Chart */}
                            <div className="h-64 bg-white/60 rounded-xl border border-gray-100 p-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formatChartData(comp)}>
                                  <PolarGrid stroke="#333" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                  {comp.areas?.map((area, idx) => (
                                    <Radar 
                                      key={area.area_id} 
                                      name={area.area_name} 
                                      dataKey={area.area_name} 
                                      stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                                      fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                                      fillOpacity={0.3} />
                                  ))}
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                            
                            {/* Bar Chart */}
                            <div className="h-64 bg-white/60 rounded-xl border border-gray-100 p-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formatChartData(comp)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                  <XAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                                  <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} cursor={{ fill: '#222' }} />
                                  {comp.areas?.map((area, idx) => (
                                    <Bar 
                                      key={area.area_id} 
                                      dataKey={area.area_name} 
                                      fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                                      radius={[4, 4, 0, 0]} />
                                  ))}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Difference Analysis / Metric Breakdown */}
                          {comp.difference_analysis && (
                            <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                              <h5 className="font-semibold text-gray-800 flex items-center gap-2 mb-3 text-sm">
                                <BarChart3 className="w-4 h-4 text-cyan-400" /> Metric Breakdown
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(comp.difference_analysis).map(([metric, diff]) => {
                                  const metricNames = {
                                    hospital: 'Healthcare', school: 'Education', park: 'Parks', police: 'Safety', pharmacy: 'Pharmacies', road: 'Connectivity'
                                  };
                                  const displayName = metricNames[metric] || metric;
                                  return (
                                    <div key={metric} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-gray-200">
                                      <span className="text-xs font-medium text-gray-700 capitalize w-24">{displayName}</span>
                                      <div className="flex-1 flex items-center justify-end gap-2">
                                        {diff.leader !== 'Tie' ? (
                                          <>
                                            <span className="text-xs text-gray-900/90 truncate max-w-[100px]">{diff.leader}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 flex items-center font-bold">
                                              <ArrowUpRight className="w-3 h-3 mr-0.5" /> {diff.delta.toFixed(1)}
                                            </span>
                                          </>
                                        ) : (
                                          <span className="text-xs text-gray-900/50 flex items-center gap-1">
                                            <Minus className="w-3 h-3" /> Tie
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
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
    </div>
  );
}