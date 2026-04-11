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

  // Search and load an area
  const searchAndLoadArea = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      const searchResult = await mapsApi.searchArea(query);
      if (searchResult.data && searchResult.data.length > 0) {
        const area = searchResult.data[0];
        setSelectedArea(area);
        setMapCenter([area.lat, area.lng]);
        setMapZoom(14);
        setSearchQuery(query);

        const analysisResult = await mapsApi.analyzeArea(area.lat, area.lng, 5000, area.displayName);

        setNearbyPlaces(analysisResult.data?.places || []);
        setAnalysis(analysisResult.data?.analysis || null);
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

  // Load data for a specific point
  const loadAreaData = useCallback(async (lat, lng, name = 'Selected Area') => {
    setLoading(true);
    setError(null);
    try {
      const analysisResult = await mapsApi.analyzeArea(lat, lng, 5000, name);
      setNearbyPlaces(analysisResult.data?.places || []);
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
