// ═══════════════════════════════════════════════════════════
// Smart Algorithmic City Generator
// Follows real urban planning principles — No API key required
// ═══════════════════════════════════════════════════════════

/**
 * Generates a realistic city layout algorithmically.
 * Zones:
 *  - Core   (0–15% radius): Police, Mall, main Mosque
 *  - Inner  (15–45% radius): Hospitals, Schools, Parks, Houses
 *  - Mid    (30–65% radius): Houses, Mosques, Roads
 *  - Outer  (65–90% radius): Industrial zones
 */
export function generateCity({
  centerLat,
  centerLng,
  cityName = 'New City',
  houses = 10,
  hospitals = 2,
  schools = 3,
  parks = 3,
  mosques = 2,
  malls = 1,
  police = 1,
  industrial = 1,
  roads = 4,
  radiusKm = 5,
}) {
  const elements = [];

  // Coordinate-to-degree conversions
  const LAT_DEG_PER_KM = 1 / 111;
  const LNG_DEG_PER_KM = 1 / (111 * Math.cos((centerLat * Math.PI) / 180));

  let seq = 0;
  function makeId() {
    return `algo-${Date.now()}-${(seq++).toString(36)}`;
  }

  /**
   * Place one element at (distKm, angleDeg) from center, with optional jitter.
   */
  function place(type, label, distKm, angleDeg, jitterKm = 0.15) {
    const rad = (angleDeg * Math.PI) / 180;
    const jitter = () => (Math.random() - 0.5) * 2 * jitterKm;

    elements.push({
      id: makeId(),
      type,
      label,
      lat: parseFloat((centerLat + (distKm * Math.cos(rad) + jitter()) * LAT_DEG_PER_KM).toFixed(6)),
      lng: parseFloat((centerLng + (distKm * Math.sin(rad) + jitter()) * LNG_DEG_PER_KM).toFixed(6)),
      source: 'algorithmic',
    });
  }

  /**
   * Evenly spread N items of the same type around a ring.
   */
  function ring(type, labelFn, count, distKm, angleOffset = 0, jitterKm = 0.15) {
    if (count <= 0) return;
    const step = 360 / count;
    for (let i = 0; i < count; i++) {
      place(type, labelFn(i), distKm, angleOffset + i * step, jitterKm);
    }
  }

  const r = radiusKm;

  // ── CITY CORE (0–15% radius) ────────────────────────────────
  // Police stations — at city center
  for (let i = 0; i < police; i++) {
    place('police', `${cityName} Police HQ${police > 1 ? ` ${i + 1}` : ''}`, r * 0.06 * (i + 1), i * 120, 0.05);
  }

  // Malls — near core, offset slightly
  const mallLabels = ['City Mall', 'Grand Plaza', 'Central Mall', 'Metro Mall'];
  for (let i = 0; i < malls; i++) {
    place('mall', mallLabels[i % mallLabels.length], r * 0.12, 30 + i * 90, 0.08);
  }

  // ── INNER ZONE (15–45% radius) ─────────────────────────────
  // Hospitals — within easy reach of residential zones
  const hospitalNames = ['General Hospital', 'City Medical Centre', 'District Hospital', 'Community Clinic', 'Regional Hospital'];
  ring('hospital', (i) => hospitalNames[i % hospitalNames.length], hospitals, r * 0.28, 45, 0.12);

  // Schools — spread evenly
  const schoolNames = ['Primary School', 'High School', 'Academy', 'Institute', 'Public School'];
  ring('school', (i) => `${cityName} ${schoolNames[i % schoolNames.length]}${schools > schoolNames.length ? ` ${Math.floor(i / schoolNames.length) + 1}` : ''}`, schools, r * 0.32, 15, 0.18);

  // Parks — distributed for accessibility
  const parkNames = ['Central Park', 'City Garden', 'Green Valley', 'Riverside Park', 'Community Garden'];
  ring('park', (i) => parkNames[i % parkNames.length], parks, r * 0.22, 70, 0.18);

  // ── RESIDENTIAL ZONE (25–60% radius) ───────────────────────
  // Houses — laid out in concentric rings of up to 6 per ring
  const DIRS = ['North', 'South', 'East', 'West', 'Upper', 'Lower'];
  for (let i = 0; i < houses; i++) {
    const ringNum = Math.floor(i / 6);
    const pos = i % 6;
    const angle = pos * 60 + ringNum * 20; // slight rotation per ring
    const dist = Math.min(r * (0.28 + ringNum * 0.1), r * 0.65);
    place('house', `${DIRS[pos]} ${cityName} Block ${i + 1}`, dist, angle, 0.12);
  }

  // Mosques — near residential pockets
  const mosqueNames = ['Jamia Masjid', 'Al-Rahman Mosque', 'Al-Noor Mosque', 'Al-Aqsa Mosque', 'Friday Mosque'];
  ring('mosque', (i) => mosqueNames[i % mosqueNames.length], mosques, r * 0.38, 30, 0.15);

  // ── OUTER ZONE (65–90% radius) — Industrial ────────────────
  ring('industrial', (i) => `${cityName} Industrial Zone${industrial > 1 ? ` ${i + 1}` : ''}`, industrial, r * 0.78, 60, 0.2);

  // ── ROADS — Radial spokes connecting core to outer ring ─────
  ring('road', (i) => `Main Road ${i + 1}`, roads, r * 0.42, 0, 0.08);

  return elements;
}
