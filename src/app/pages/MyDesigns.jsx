import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { PenTool, Trash2, Loader2, Calendar, Hash, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';
import { useNavigate } from 'react-router';

export function MyDesigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (user) loadDesigns();
  }, [user]);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const res = await mapsApi.getUserDesigns();
      setDesigns(res.data || []);
    } catch (err) {
      console.error('Load designs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this design?')) return;
    setDeleting(id);
    try {
      await mapsApi.deleteDesign(id);
      setDesigns(designs.filter((d) => d._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleLoad = (id) => {
    navigate(`/planner?load=${id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-8 text-center">
        <p className="text-gray-900/50">Please login to view your designs</p>
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
      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
            My Designs
          </h1>
          <p className="text-gray-900/50 mt-2">Your saved urban planning layouts</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 mx-auto animate-spin" />
          </div>
        ) : designs.length === 0 ? (
          <GlassPanel>
            <div className="text-center py-16">
              <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No saved designs yet</p>
              <p className="text-gray-400 text-sm mt-1">Create a layout in the Planner and save it</p>
              <button onClick={() => navigate('/planner')} className="mt-4 px-6 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 text-sm hover:bg-purple-500/30 transition-colors">
                Open Planner
              </button>
            </div>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {designs.map((design, i) => (
                <motion.div
                  key={design._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassPanel>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900/90 truncate flex items-center gap-2">
                            <PenTool className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            {design.design_name}
                          </h3>
                        </div>
                        {design.evaluation_score != null && (
                          <div className={`text-xl font-bold ml-2 ${design.evaluation_score >= 70 ? 'text-green-400' : design.evaluation_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {design.evaluation_score}<span className="text-xs text-gray-400">/100</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{design.element_count} elements</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(design.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => handleLoad(design._id)} className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/20 rounded-xl text-xs text-purple-300 transition-colors">
                          Load in Planner
                        </button>
                        <button
                          onClick={() => handleDelete(design._id)}
                          disabled={deleting === design._id}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs text-red-400 transition-colors"
                        >
                          {deleting === design._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
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
