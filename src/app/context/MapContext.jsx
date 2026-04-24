import { createContext, useContext, useState, useCallback } from 'react';
import mapsApi from '../services/mapsApi';

const MapContext = createContext(null);

export function MapProvider({ children }) {
  const [mapCenter, setMapCenter] = useState([33.6844, 73.0479]); // Islamabad default
  const [mapZoom, setMapZoom] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [roads, setRoads] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Layer visibility toggles
  const [layers, setLayers] = useState({
    hospitals: true,
    schools: true,
    parks: true,
    mosques: false,
    banks: false,
    police: false,
    pharmacies: false,
    roads: true,
    coverageCircles: false,
  });

  const toggleLayer = useCallback((layerName) => {
    setLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  }, []);

  // Search and load an area — uses the persistent search endpoint
  const searchAndLoadArea = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mapsApi.searchAndSaveArea(query, 5000);
      if (result.data) {
        const { area, analysis: resultAnalysis, places, roads: roadData, roadCount } = result.data;

        // Extract lat/lng from either saved area (coordinates.coordinates) or plain object
        let lat, lng, displayName;
        if (area.coordinates && area.coordinates.coordinates) {
          lng = area.coordinates.coordinates[0];
          lat = area.coordinates.coordinates[1];
          displayName = area.display_name || area.displayName || query;
        } else {
          lat = area.lat;
          lng = area.lng;
          displayName = area.displayName || query;
        }

        if (!lat || !lng) {
          setError('Could not determine area coordinates');
          return;
        }

        setSelectedArea({
          id: area._id || null,
          lat,
          lng,
          displayName,
        });
        setMapCenter([lat, lng]);
        setMapZoom(14);
        setSearchQuery(query);

        // Set places
        setNearbyPlaces(places || []);

        // Set roads from the response (now includes cached roads too)
        if (roadData && roadData.length > 0) {
          setRoads(roadData);
        } else if (roadCount > 0) {
          // Fallback: load roads separately
          try {
            const roadResult = await mapsApi.roads(lat, lng, 3000);
            setRoads(roadResult.data || []);
          } catch (err) {
            console.error('Roads fallback fetch error:', err);
          }
        } else {
          setRoads([]);
        }

        // Set analysis
        setAnalysis(resultAnalysis || null);

        console.log(`[MapContext] Loaded: ${(places || []).length} places, ${roadCount || 0} roads, score=${resultAnalysis?.score}`);
      } else {
        setError('No results found for this search');
      }
    } catch (err) {
      setError(err.message || 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data for a specific point (map click)
  const loadAreaData = useCallback(async (lat, lng, name = 'Selected Area') => {
    setLoading(true);
    setError(null);
    try {
      const analysisResult = await mapsApi.analyzeArea(lat, lng, 5000, name);
      setNearbyPlaces(analysisResult.data?.places || []);
      setRoads(analysisResult.data?.roads || []);
      setAnalysis(analysisResult.data?.analysis || null);
      setSelectedArea({ lat, lng, displayName: name });
      setMapCenter([lat, lng]);
    } catch (err) {
      setError(err.message || 'Failed to load area data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load roads for area
  const loadRoads = useCallback(async (lat, lng, radius = 3000) => {
    try {
      const result = await mapsApi.roads(lat, lng, radius);
      setRoads(result.data || []);
    } catch (err) {
      console.error('Roads fetch error:', err);
    }
  }, []);

  // Load a previously saved area (from SavedAreas page)
  const loadFromSavedArea = useCallback(async (areaId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mapsApi.getArea(areaId);
      if (result.data) {
        const { area, analytics } = result.data;
        const lat = area.coordinates?.coordinates[1];
        const lng = area.coordinates?.coordinates[0];

        setSelectedArea({
          id: area._id,
          lat,
          lng,
          displayName: area.display_name || area.area_name,
        });
        setMapCenter([lat, lng]);
        setMapZoom(14);
        setAnalysis(analytics || null);

        // Load fresh places and roads for the area
        const analysisResult = await mapsApi.analyzeArea(lat, lng, area.radius || 5000);
        setNearbyPlaces(analysisResult.data?.places || []);
        loadRoads(lat, lng);
      }
    } catch (err) {
      setError(err.message || 'Failed to load saved area');
    } finally {
      setLoading(false);
    }
  }, [loadRoads]);

  return (
    <MapContext.Provider
      value={{
        mapCenter, setMapCenter,
        mapZoom, setMapZoom,
        searchQuery, setSearchQuery,
        selectedArea, setSelectedArea,
        nearbyPlaces, setNearbyPlaces,
        roads, setRoads,
        analysis, setAnalysis,
        loading, error,
        layers, toggleLayer,
        searchAndLoadArea,
        loadAreaData,
        loadRoads,
        loadFromSavedArea,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMap must be used within MapProvider');
  return context;
}
