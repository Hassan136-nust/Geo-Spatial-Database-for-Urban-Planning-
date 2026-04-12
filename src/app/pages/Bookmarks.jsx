import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { Bookmark as BookmarkIcon, Trash2, Loader2, Filter, MapPin, PenTool, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';

const TYPE_ICONS = { landmark: '📍', area: '🗺️', design: '📐', city: '🏙️', report: '📄' };
const TYPE_COLORS = { landmark: 'text-cyan-400', area: 'text-green-400', design: 'text-purple-400', city: 'text-amber-400', report: 'text-orange-400' };

export function Bookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (user) loadBookmarks();
  }, [user, filterType]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const res = await mapsApi.getBookmarks(filterType);
      setBookmarks(res.data || []);
    } catch (err) {
      console.error('Load bookmarks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    setDeleting(id);
    try {
      await mapsApi.removeBookmark(id);
      setBookmarks(bookmarks.filter((b) => b._id !== id));
    } catch (err) {
      console.error('Remove error:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (!user) return <div className="min-h-screen pt-28 pb-20 px-8 text-center"><p className="text-white/50">Please login</p></div>;

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">Bookmarks</h1>
          <p className="text-white/50 mt-2">Your saved favorites</p>
        </motion.div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'landmark', 'area', 'design', 'city', 'report'].map((type) => (
            <button key={type} onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filterType === type ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
              {type ? `${TYPE_ICONS[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}` : '📋 All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-amber-400 mx-auto animate-spin" /></div>
        ) : bookmarks.length === 0 ? (
          <GlassPanel>
            <div className="text-center py-16">
              <BookmarkIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No bookmarks yet</p>
              <p className="text-white/30 text-sm mt-1">Save landmarks, areas, or designs to access them quickly</p>
            </div>
          </GlassPanel>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bm, i) => (
              <motion.div key={bm._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassPanel>
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                      {TYPE_ICONS[bm.resource_type] || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white/90 truncate">{bm.resource_name || 'Unnamed'}</h4>
                      <div className="flex items-center gap-2 text-xs text-white/30 mt-0.5">
                        <span className={TYPE_COLORS[bm.resource_type]}>{bm.resource_type}</span>
                        <span>{new Date(bm.created_at).toLocaleDateString()}</span>
                        {bm.notes && <span className="truncate max-w-[150px]">— {bm.notes}</span>}
                      </div>
                    </div>
                    {bm.tags?.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0">
                        {bm.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] text-white/40">{tag}</span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => handleRemove(bm._id)} disabled={deleting === bm._id} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                      {deleting === bm._id ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <Trash2 className="w-4 h-4 text-red-400" />}
                    </button>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
