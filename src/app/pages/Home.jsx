import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GlassPanel } from '../components/GlassPanel';
import { Link } from 'react-router';
import { MapPin, Building2, Route, ArrowRight, Globe2, Search, Compass, PenTool, BarChart3, FileDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export function Home() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6"
          >
            <Globe2 className="w-4 h-4" />
            Powered by OpenStreetMap — 100% Free & Open Data
          </motion.div>

          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent leading-tight">
            UrbanPulse
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-4">
            Dynamic Urban Planning Intelligence — Real-time map analytics, infrastructure analysis, and interactive planning tools
          </p>
          <p className="text-sm text-white/40 max-w-xl mx-auto mb-10">
            Search any area worldwide • Real-time infrastructure data • Drag & Drop Planner • PDF Reports
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                Open Map Dashboard
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link to="/planner">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <PenTool className="w-4 h-4" />
                Urban Planner
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Interactive Map', value: '🗺️', desc: 'Search & explore any area', icon: Search, color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-transparent', link: '/dashboard' },
            { label: 'Live Data', value: '📡', desc: 'Real-time from OpenStreetMap', icon: Compass, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-transparent', link: '/dashboard' },
            { label: 'Drag & Drop', value: '✏️', desc: 'Plan your own urban layout', icon: PenTool, color: 'text-amber-400', gradient: 'from-amber-500/20 to-transparent', link: '/planner' },
            { label: 'PDF Reports', value: '📊', desc: 'Download planning analysis', icon: FileDown, color: 'text-purple-400', gradient: 'from-purple-500/20 to-transparent', link: '/analytics' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} to={stat.link}>
                <GlassPanel delay={0.1 * index}>
                  <div className={`p-6 bg-gradient-to-b ${stat.gradient} rounded-2xl cursor-pointer`}>
                    <Icon className={`w-8 h-8 ${stat.color} mb-4`} />
                    <div className="text-4xl mb-2">{stat.value}</div>
                    <div className="text-sm text-white/80 font-medium">{stat.label}</div>
                    <div className="text-xs text-white/40 mt-1">{stat.desc}</div>
                  </div>
                </GlassPanel>
              </Link>
            );
          })}
        </div>

        {/* Map preview + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassPanel delay={0.5}>
            <div className="p-2 h-80 rounded-2xl overflow-hidden">
              <MapContainer
                center={[33.6844, 73.0479]}
                zoom={11}
                className="h-full w-full rounded-xl"
                zoomControl={false}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap'
                />
                <Marker position={[33.6844, 73.0479]}>
                  <Popup><strong>Islamabad</strong><br/>Capital of Pakistan</Popup>
                </Marker>
              </MapContainer>
            </div>
          </GlassPanel>

          <GlassPanel delay={0.6}>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">How It Works</h3>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Search Any Area', desc: 'Type any location worldwide — the system fetches real data from OpenStreetMap' },
                  { step: '2', title: 'Analyze Infrastructure', desc: 'Automatically detects hospitals, schools, parks, roads and calculates coverage scores' },
                  { step: '3', title: 'Plan & Design', desc: 'Use the drag-and-drop planner to design urban layouts with intelligent recommendations' },
                  { step: '4', title: 'Generate Reports', desc: 'Download professional PDF reports with analysis, gaps, and suggestions' },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-cyan-400">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80">{item.title}</div>
                      <div className="text-xs text-white/40">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
