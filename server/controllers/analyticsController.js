import Zone from '../models/Zone.js';
import Road from '../models/Road.js';
import Landmark from '../models/Landmark.js';
import Utility from '../models/Utility.js';
import PopulationData from '../models/PopulationData.js';
import User from '../models/User.js';

// @desc    Dashboard overview stats
// @route   GET /api/analytics/overview
export const overview = async (req, res, next) => {
  try {
    const [zones, roads, landmarks, utilities, population, users] = await Promise.all([
      Zone.countDocuments(),
      Road.countDocuments(),
      Landmark.countDocuments(),
      Utility.countDocuments(),
      PopulationData.aggregate([{ $group: { _id: null, total: { $sum: '$population_count' } } }]),
      User.countDocuments(),
    ]);

    const totalPopulation = population.length > 0 ? population[0].total : 0;

    const landmarksByType = await Landmark.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const zonesByType = await Zone.aggregate([
      { $group: { _id: '$zone_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const roadsByType = await Road.aggregate([
      { $group: { _id: '$road_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const totalRoadLength = await Road.aggregate([
      { $group: { _id: null, total: { $sum: '$length_km' } } },
    ]);

    res.json({
      success: true,
      data: {
        counts: { zones, roads, landmarks, utilities, totalPopulation, users },
        landmarksByType,
        zonesByType,
        roadsByType,
        totalRoadLength: totalRoadLength.length > 0 ? totalRoadLength[0].total : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Coverage analytics
// @route   GET /api/analytics/coverage
export const coverage = async (req, res, next) => {
  try {
    const hospitals = await Landmark.find({ type: 'hospital' });
    const schools = await Landmark.find({ type: { $in: ['school', 'university'] } });
    const parks = await Landmark.find({ type: 'park' });
    const zones = await Zone.find();

    const hospitalCoverage = zones.map((zone) => {
      const nearbyHospitals = hospitals.filter((h) => {
        const [hLng, hLat] = h.geometry.coordinates;
        const zoneCenterLng = zone.geometry.coordinates[0].reduce((sum, c) => sum + c[0], 0) / zone.geometry.coordinates[0].length;
        const zoneCenterLat = zone.geometry.coordinates[0].reduce((sum, c) => sum + c[1], 0) / zone.geometry.coordinates[0].length;
        const dist = Math.sqrt(Math.pow(hLng - zoneCenterLng, 2) + Math.pow(hLat - zoneCenterLat, 2));
        return dist < 0.05;
      });
      return { zone: zone.name, hospitals: nearbyHospitals.length, covered: nearbyHospitals.length > 0 };
    });

    const educationCoverage = zones.map((zone) => {
      const nearbySchools = schools.filter((s) => {
        const [sLng, sLat] = s.geometry.coordinates;
        const zoneCenterLng = zone.geometry.coordinates[0].reduce((sum, c) => sum + c[0], 0) / zone.geometry.coordinates[0].length;
        const zoneCenterLat = zone.geometry.coordinates[0].reduce((sum, c) => sum + c[1], 0) / zone.geometry.coordinates[0].length;
        const dist = Math.sqrt(Math.pow(sLng - zoneCenterLng, 2) + Math.pow(sLat - zoneCenterLat, 2));
        return dist < 0.05;
      });
      return { zone: zone.name, schools: nearbySchools.length, covered: nearbySchools.length > 0 };
    });

    res.json({
      success: true,
      data: {
        hospitalCoverage,
        educationCoverage,
        summary: {
          zonesWithHospital: hospitalCoverage.filter((z) => z.covered).length,
          zonesWithoutHospital: hospitalCoverage.filter((z) => !z.covered).length,
          zonesWithSchool: educationCoverage.filter((z) => z.covered).length,
          zonesWithoutSchool: educationCoverage.filter((z) => !z.covered).length,
          totalHospitals: hospitals.length,
          totalSchools: schools.length,
          totalParks: parks.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gap detection
// @route   GET /api/analytics/gaps
export const gaps = async (req, res, next) => {
  try {
    const zones = await Zone.find();
    const landmarks = await Landmark.find();
    const utilities = await Utility.find();

    const gapAnalysis = zones.map((zone) => {
      const zoneCenterLng = zone.geometry.coordinates[0].reduce((sum, c) => sum + c[0], 0) / zone.geometry.coordinates[0].length;
      const zoneCenterLat = zone.geometry.coordinates[0].reduce((sum, c) => sum + c[1], 0) / zone.geometry.coordinates[0].length;

      const nearbyLandmarks = landmarks.filter((l) => {
        const [lLng, lLat] = l.geometry.coordinates;
        const dist = Math.sqrt(Math.pow(lLng - zoneCenterLng, 2) + Math.pow(lLat - zoneCenterLat, 2));
        return dist < 0.04;
      });

      const hasHospital = nearbyLandmarks.some((l) => l.type === 'hospital');
      const hasSchool = nearbyLandmarks.some((l) => ['school', 'university'].includes(l.type));
      const hasPark = nearbyLandmarks.some((l) => l.type === 'park');
      const hasCommercial = nearbyLandmarks.some((l) => l.type === 'commercial');

      const gaps = [];
      if (!hasHospital) gaps.push('hospital');
      if (!hasSchool) gaps.push('education');
      if (!hasPark) gaps.push('green_space');
      if (!hasCommercial) gaps.push('commercial');

      return {
        zone: zone.name,
        zone_type: zone.zone_type,
        center: { lng: zoneCenterLng, lat: zoneCenterLat },
        nearbyFacilities: nearbyLandmarks.length,
        gaps,
        gapScore: gaps.length,
        needsAttention: gaps.length >= 2,
      };
    });

    const criticalZones = gapAnalysis.filter((z) => z.needsAttention).sort((a, b) => b.gapScore - a.gapScore);

    res.json({
      success: true,
      data: {
        gapAnalysis,
        criticalZones,
        summary: {
          totalZones: zones.length,
          zonesNeedingAttention: criticalZones.length,
          averageGapScore: (gapAnalysis.reduce((sum, z) => sum + z.gapScore, 0) / gapAnalysis.length).toFixed(1),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Zone summary with population
// @route   GET /api/analytics/zone-summary
export const zoneSummary = async (req, res, next) => {
  try {
    const zones = await Zone.find();
    const populationData = await PopulationData.find();

    const summary = zones.map((zone) => {
      const pop = populationData.find((p) => p.zone_id.toString() === zone._id.toString());
      return {
        zone: zone.name,
        zone_type: zone.zone_type,
        area_sqkm: zone.area_sqkm,
        status: zone.status,
        population: pop ? pop.population_count : 0,
        households: pop ? pop.household_count : 0,
        growth_rate: pop ? pop.growth_rate : 0,
        income_level: pop ? pop.income_level : 'unknown',
        density: pop && zone.area_sqkm > 0 ? Math.round(pop.population_count / zone.area_sqkm) : 0,
      };
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};
