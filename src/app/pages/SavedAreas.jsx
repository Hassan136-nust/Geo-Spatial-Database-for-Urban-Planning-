import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { MapPin, Trash2, ExternalLink, Clock, Star, Loader2, Search, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';
import { useNavigate } from 'react-router';

export function SavedAreas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (user) loadAreas();
  }, [user]);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const res = await mapsApi.getAreaHistory();
      setAreas(res.data || []);
    } catch (err) {
      console.error('Load areas error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this saved area?')) return;
    setDeleting(id);
    try {
      await mapsApi.deleteArea(id);
      setAreas(areas.filter((a) => a._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'from-green-500/10 to-green-500/5 border-green-500/20';
    if (score >= 50) return 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20';
    return 'from-red-500/10 to-red-500/5 border-red-500/20';
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-8 text-center">
        <p className="text-text-primary font-medium" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>Please login to view saved areas</p>
      </div>
    );
  }

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
      {/* No overlay - clear background image */}
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">
            Saved Areas
          </h1>
          <p className="text-text-secondary mt-2">Your search history with cached analytics</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
          </div>
        ) : areas.length === 0 ? (
          <GlassPanel>
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-primary/50 mx-auto mb-4" />
              <p className="text-text-primary">No saved areas yet</p>
              <p className="text-text-secondary text-sm mt-1">Search for an area on the Dashboard to get started</p>
              <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-2 bg-primary/20 border border-primary/30 rounded-xl text-primary text-sm hover:bg-primary/30 transition-colors">
                Go to Dashboard
              </button>
            </div>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {areas.map((area, i) => (
                <motion.div
                  key={area._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassPanel>
                    <div className={`p-5 bg-gradient-to-br ${getScoreBg(area.last_analysis_score)} rounded-2xl`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">{area.area_name}</h3>
                          <p className="text-xs text-text-secondary mt-1 truncate">{area.display_name}</p>
                        </div>
                        {area.last_analysis_score != null && (
                          <div className={`text-2xl font-bold ${getScoreColor(area.last_analysis_score)}`}>
                            {area.last_analysis_score}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-secondary mb-4 font-medium">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{area.city || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(area.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{area.landmark_count} landmarks</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/dashboard')} className="flex-1 px-3 py-2 bg-white/80 hover:bg-white rounded-xl text-xs text-text-primary font-semibold transition-colors flex items-center justify-center gap-1">
                          <ExternalLink className="w-3 h-3" /> View on Map
                        </button>
                        <button
                          onClick={() => handleDelete(area._id)}
                          disabled={deleting === area._id}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs text-red-400 transition-colors"
                        >
                          {deleting === area._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
