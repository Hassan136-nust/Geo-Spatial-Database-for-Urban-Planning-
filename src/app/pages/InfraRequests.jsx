import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { Plus, ThumbsUp, ThumbsDown, Loader2, MapPin, Clock, Filter, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';

const TYPE_ICONS = { hospital: '🏥', school: '🏫', park: '🌳', road: '🛣️', police: '🚔', fire_station: '🚒', mosque: '🕌', library: '📚', other: '📍' };
const STATUS_COLORS = { pending: 'bg-yellow-500/20 text-yellow-400', under_review: 'bg-blue-500/20 text-blue-400', approved: 'bg-green-500/20 text-green-400', rejected: 'bg-red-500/20 text-red-400', completed: 'bg-purple-500/20 text-purple-400' };

export function InfraRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', request_type: 'hospital', priority: 'medium', lat: 33.6844, lng: 73.0479, city: '', justification: '' });
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState({ status: '', request_type: '' });

  useEffect(() => { loadRequests(); }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const filterObj = {};
      if (filter.status) filterObj.status = filter.status;
      if (filter.request_type) filterObj.request_type = filter.request_type;
      const res = await mapsApi.getInfraRequests(filterObj);
      setRequests(res.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    setCreating(true);
    try {
      const res = await mapsApi.submitInfraRequest(form);
      setRequests([res.data, ...requests]);
      setShowCreate(false); setForm({ ...form, title: '', description: '', justification: '' });
    } catch (err) { console.error(err); } finally { setCreating(false); }
  };

  const handleVote = async (id, vote) => {
    if (!user) return;
    try {
      const res = await mapsApi.voteInfraRequest(id, vote);
      setRequests(requests.map((r) => r._id === id ? res.data : r));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-300 to-red-400 bg-clip-text text-transparent">Infrastructure Proposals</h1>
            <p className="text-white/50 mt-2">Community requests for new infrastructure</p>
          </div>
          {user && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(!showCreate)} className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-rose-500/25">
              <Plus className="w-4 h-4" /> Submit Proposal
            </motion.button>
          )}
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filter.request_type} onChange={(e) => setFilter({ ...filter, request_type: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none">
            <option value="">All Types</option>
            <option value="hospital">Hospital</option>
            <option value="school">School</option>
            <option value="park">Park</option>
            <option value="road">Road</option>
            <option value="police">Police</option>
          </select>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6">
              <GlassPanel>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">New Proposal</h3><button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-white/40" /></button></div>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-rose-500/50" />
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm mb-3 h-24 resize-none focus:outline-none focus:border-rose-500/50" />
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <select value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                      {Object.keys(TYPE_ICONS).map((t) => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                    </select>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                    </select>
                  </div>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-rose-500/50" />
                  <button onClick={handleCreate} disabled={creating} className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />} Submit Proposal
                  </button>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-rose-400 mx-auto animate-spin" /></div>
        ) : requests.length === 0 ? (
          <GlassPanel><div className="text-center py-16"><p className="text-white/40">No proposals found</p></div></GlassPanel>
        ) : (
          <div className="space-y-3">
            {requests.map((req, i) => (
              <motion.div key={req._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassPanel>
                  <div className="p-4 flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 min-w-[40px]">
                      <button onClick={() => handleVote(req._id, 'upvote')} className="p-1 hover:bg-green-500/10 rounded transition-colors"><ThumbsUp className="w-4 h-4 text-green-400" /></button>
                      <span className={`text-sm font-bold ${req.vote_count > 0 ? 'text-green-400' : req.vote_count < 0 ? 'text-red-400' : 'text-white/30'}`}>{req.vote_count || 0}</span>
                      <button onClick={() => handleVote(req._id, 'downvote')} className="p-1 hover:bg-red-500/10 rounded transition-colors"><ThumbsDown className="w-4 h-4 text-red-400" /></button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{TYPE_ICONS[req.request_type] || '📍'}</span>
                        <h4 className="font-semibold text-white/90 truncate">{req.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status] || ''}`}>{req.status}</span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-2 mb-2">{req.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-white/30">
                        <span><MapPin className="w-3 h-3 inline" /> {req.city || 'Unknown'}</span>
                        <span><Clock className="w-3 h-3 inline" /> {new Date(req.created_at).toLocaleDateString()}</span>
                        <span className={`px-1.5 py-0.5 rounded ${req.priority === 'critical' ? 'bg-red-500/20 text-red-400' : req.priority === 'high' ? 'bg-amber-500/20 text-amber-400' : ''}`}>{req.priority}</span>
                      </div>
                    </div>
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
