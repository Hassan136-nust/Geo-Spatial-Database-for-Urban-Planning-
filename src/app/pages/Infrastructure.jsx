import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { Building2, Plus, Pencil, Trash2, X, Save, MapPin, Star, Heart, Stethoscope, GraduationCap, Trees, Landmark as LandmarkIcon } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const typeIcons = { hospital: Stethoscope, university: GraduationCap, school: GraduationCap, park: Trees, government: LandmarkIcon, religious: Star, commercial: Building2, monument: LandmarkIcon, other: MapPin };
const typeColors = { hospital: 'text-red-400 bg-red-400/10', university: 'text-blue-400 bg-blue-400/10', school: 'text-indigo-400 bg-indigo-400/10', park: 'text-green-400 bg-green-400/10', government: 'text-amber-400 bg-amber-400/10', religious: 'text-purple-400 bg-purple-400/10', commercial: 'text-pink-400 bg-pink-400/10', monument: 'text-cyan-400 bg-cyan-400/10', other: 'text-white/60 bg-white/10' };

export function Infrastructure() {
  const [landmarks, setLandmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuth();
  const canEdit = user && (user.role === 'admin' || user.role === 'planner');

  const [formData, setFormData] = useState({ name: '', type: 'hospital', subtype: '', description: '', address: '', capacity: 0, service_radius_km: 2, status: 'operational' });

  useEffect(() => { loadLandmarks(); }, []);

  const loadLandmarks = async () => {
    try { const res = await api.get('/landmarks'); setLandmarks(res.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this landmark?')) return;
    try { await api.delete(`/landmarks/${id}`); setLandmarks(landmarks.filter((l) => l._id !== id)); }
    catch (err) { alert(err.message); }
  };

  const handleEdit = (lm) => {
    setEditingId(lm._id);
    setFormData({ name: lm.name, type: lm.type, subtype: lm.subtype || '', description: lm.description || '', address: lm.address || '', capacity: lm.capacity, service_radius_km: lm.service_radius_km, status: lm.status });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/landmarks/${editingId}`, formData);
        setLandmarks(landmarks.map((l) => l._id === editingId ? res.data.data : l));
      } else {
        const res = await api.post('/landmarks', { ...formData, geometry: { type: 'Point', coordinates: [73.05, 33.70] } });
        setLandmarks([...landmarks, res.data.data]);
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) { alert(err.message); }
  };

  const filtered = filter ? landmarks.filter((l) => l.type === filter) : landmarks;
  const types = [...new Set(landmarks.map((l) => l.type))];

  if (loading) {
    return <div className="min-h-screen pt-32 flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">Infrastructure</h1>
            <p className="text-lg text-white/50">{landmarks.length} landmarks across Islamabad</p>
          </div>
          {canEdit && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', type: 'hospital', subtype: '', description: '', address: '', capacity: 0, service_radius_km: 2, status: 'operational' }); }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25">
              <Plus className="w-4 h-4" /> Add Landmark
            </motion.button>
          )}
        </motion.div>

        {/* Type Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filter === '' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/60 border border-white/10'}`}>All ({landmarks.length})</button>
          {types.map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-full text-xs font-medium capitalize transition-colors ${filter === t ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/60 border border-white/10'}`}>{t} ({landmarks.filter((l) => l.type === t).length})</button>
          ))}
        </div>

        {/* Landmarks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((lm, i) => {
            const Icon = typeIcons[lm.type] || MapPin;
            const colorCls = typeColors[lm.type] || typeColors.other;
            return (
              <GlassPanel key={lm._id} delay={0.03 * i}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorCls}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold leading-tight">{lm.name}</h3>
                        <span className="text-xs text-white/40 capitalize">{lm.subtype || lm.type}</span>
                      </div>
                    </div>
                    {lm.rating > 0 && (
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        <Star className="w-3 h-3 fill-current" /> {lm.rating}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mb-3 line-clamp-2">{lm.description}</p>
                  {lm.address && <p className="text-xs text-white/30 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" />{lm.address}</p>}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/5 rounded-lg p-2"><span className="text-white/40">Capacity</span><div className="font-bold">{lm.capacity?.toLocaleString()}</div></div>
                    <div className="bg-white/5 rounded-lg p-2"><span className="text-white/40">Radius</span><div className="font-bold">{lm.service_radius_km} km</div></div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className={`text-xs ${lm.status === 'operational' ? 'text-green-400' : 'text-amber-400'} capitalize`}>{lm.status}</span>
                    {canEdit && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleEdit(lm)} className="p-1.5 hover:bg-white/10 rounded-lg"><Pencil className="w-3 h-3 text-white/50" /></button>
                        <button onClick={() => handleDelete(lm._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3 text-red-400/50" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showForm && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <div className="backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl p-6">
                  <div className="flex justify-between mb-6"><h3 className="text-xl font-bold">{editingId ? 'Edit' : 'New'} Landmark</h3><button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div>
                  <form onSubmit={handleSave} className="space-y-3">
                    <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50" required />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm">
                        {['hospital','university','school','park','government','religious','commercial','monument','other'].map(t => <option key={t} value={t} className="bg-gray-900 capitalize">{t}</option>)}
                      </select>
                      <input type="text" placeholder="Subtype" value={formData.subtype} onChange={(e) => setFormData({ ...formData, subtype: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                    </div>
                    <input type="text" placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                    <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm h-20 resize-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" placeholder="Capacity" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                      <input type="number" step="0.5" placeholder="Radius (km)" value={formData.service_radius_km} onChange={(e) => setFormData({ ...formData, service_radius_km: parseFloat(e.target.value) })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Save className="w-4 h-4" />{editingId ? 'Update' : 'Create'}</button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
