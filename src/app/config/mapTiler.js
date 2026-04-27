// ═══════════════════════════════════════════════════════════
// MapTiler Configuration — Centralized tile & API settings
// ═══════════════════════════════════════════════════════════

// Your MapTiler API key — set in .env as VITE_MAPTILER_KEY
export const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

// ── Tile URLs ─────────────────────────────────────────────
// MapTiler dark style — perfect for urban planning dashboards
export const MAPTILER_DARK_STYLE = `https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;

// Alternative styles you can swap in:
export const MAPTILER_STREETS = `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
export const MAPTILER_SATELLITE = `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
export const MAPTILER_TOPO = `https://api.maptiler.com/maps/topo-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;

// ── Default Tile URL (used across all map pages) ──────────
export const MAP_TILE_URL = MAPTILER_STREETS;

// ── Attribution ───────────────────────────────────────────
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>';
