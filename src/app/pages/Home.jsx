import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GlassPanel } from '../components/GlassPanel';
import { Link } from 'react-router';
import { MapPin, Building2, Route, ArrowRight, Globe2, Search, Compass, PenTool, FileDown, MapPinned, Radio, PencilRuler, BarChart } from 'lucide-react';
import { MAP_TILE_URL, MAP_ATTRIBUTION } from '../config/mapTiler';
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
      
      <div className="max-w-7xl mx-auto relative z-10">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6 font-medium"
          >
            <Globe2 className="w-4 h-4" />
            <span>Global Urban Data Platform</span>
          </motion.div>

          <h1 className="text-7xl font-bold mb-6 text-foreground leading-tight">
            UrbanPulse
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Dynamic Urban Planning Intelligence — Real-time map analytics, infrastructure analysis, and interactive planning tools
          </p>
          <p className="text-sm text-muted-foreground/80 max-w-xl mx-auto mb-10">
            Search any area worldwide • Real-time infrastructure data • Drag & Drop Planner • PDF Reports
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-primary rounded-full text-primary-foreground font-semibold flex items-center gap-2 shadow-lg"
              >
                Open Map Dashboard
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link to="/planner">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-card border border-border rounded-full text-card-foreground font-semibold hover:bg-muted transition-colors flex items-center gap-2 shadow-sm"
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
            { label: 'Interactive Map', desc: 'Search & explore any area', icon: MapPinned, link: '/dashboard' },
            { label: 'Live Data', desc: 'Real-time geospatial data', icon: Radio, link: '/dashboard' },
            { label: 'Drag & Drop', desc: 'Plan your own urban layout', icon: PencilRuler, link: '/planner' },
            { label: 'PDF Reports', desc: 'Download planning analysis', icon: BarChart, link: '/analytics' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} to={stat.link}>
                <GlassPanel delay={0.1 * index}>
                  <div className="p-6 bg-card border border-border rounded-2xl cursor-pointer hover:shadow-md transition-shadow">
                    <Icon className="w-12 h-12 text-primary mb-4" />
                    <div className="text-lg text-card-foreground font-semibold">{stat.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.desc}</div>
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
                  url={MAP_TILE_URL}
                  attribution={MAP_ATTRIBUTION}
                />
                <Marker position={[33.6844, 73.0479]}>
                  <Popup><strong>Islamabad</strong><br/>Capital of Pakistan</Popup>
                </Marker>
              </MapContainer>
            </div>
          </GlassPanel>

          <GlassPanel delay={0.6}>
            <div className="p-8 bg-card border border-border rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-foreground">How It Works</h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Search Any Area', desc: 'Type any location worldwide — the system fetches real geospatial data via MapTiler' },
                  { step: '2', title: 'Analyze Infrastructure', desc: 'Automatically detects hospitals, schools, parks, roads and calculates coverage scores' },
                  { step: '3', title: 'Plan & Design', desc: 'Use the drag-and-drop planner to design urban layouts with intelligent recommendations' },
                  { step: '4', title: 'Generate Reports', desc: 'Download professional PDF reports with analysis, gaps, and suggestions' },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-card-foreground">{item.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{item.desc}</div>
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
