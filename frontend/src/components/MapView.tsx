import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Itinerary } from '../types';
import Map, { Location } from './Map';
import { FaMap, FaList, FaFilter, FaSearch } from 'react-icons/fa';

/**
 * MapView component displays all user itineraries on an interactive map
 * Allows filtering by destination and viewing itinerary details
 */
const MapView: React.FC = () => {
  const { currentUser, getIdToken } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [locationTypes, setLocationTypes] = useState({
    destination: true,
    activity: true,
    restaurant: true,
    hotel: true
  });

  /**
   * Simple geocoding function using Nominatim API
   */
  const geocodeLocation = useCallback(async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      // Geocoding error logged for debugging
    }
    
    return null;
  }, []);

  /**
   * Process itineraries to extract location data for map display
   */
  const processItinerariesForMap = useCallback(async (itineraryList: Itinerary[]) => {
    const locations: Location[] = [];
    
    // Process each itinerary to extract locations
    for (const itinerary of itineraryList) {
      try {
        // Add main destination
        const mainLocation = await geocodeLocation(itinerary.destination);
        if (mainLocation) {
          locations.push({
            name: itinerary.destination,
            lat: mainLocation.lat,
            lng: mainLocation.lng,
            type: 'destination',
            description: `${itinerary.days}-day trip to ${itinerary.destination}`,
            itineraryId: itinerary.id,
            createdAt: itinerary.created_at
          });
        }
      } catch (error) {
        // Geocoding error logged for debugging
      }
    }
    
    setAllLocations(locations);
    setFilteredLocations(locations);
  }, [geocodeLocation]);

  /**
   * Fetch all user itineraries from the backend
   */
  const fetchItineraries = useCallback(async () => {
    if (!currentUser?.email) {
      setError('You must be logged in to view the map');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/history/?user_email=${encodeURIComponent(currentUser.email)}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch itineraries: ${response.status}`);
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      setItineraries(data);
      await processItinerariesForMap(data);
    } catch (err) {
      // Error logged for debugging
      setError(err instanceof Error ? err.message : 'Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  }, [currentUser, getIdToken, processItinerariesForMap]);



  /**
   * Filter locations based on search term and type filters
   */
  useEffect(() => {
    let filtered = allLocations;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(location => 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by location types
    filtered = filtered.filter(location => locationTypes[location.type]);
    
    setFilteredLocations(filtered);
  }, [allLocations, searchTerm, locationTypes]);

  /**
   * Load itineraries on component mount
   */
  useEffect(() => {
    fetchItineraries();
  }, [fetchItineraries]);

  /**
   * Handle location type filter changes
   */
  const handleTypeFilterChange = (type: keyof typeof locationTypes) => {
    setLocationTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  /**
   * Handle location click to show itinerary details
   */
  const handleLocationClick = (location: Location) => {
    if (location.itineraryId) {
      const itinerary = itineraries.find(it => it.id === location.itineraryId);
      if (itinerary) {
        setSelectedItinerary(itinerary);
      }
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading your travel map...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Map</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchItineraries}
                className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaMap className="text-primary text-3xl" />
            <h1 className="text-3xl font-bold text-white">Travel Map</h1>
          </div>
          <p className="text-gray-400">
            Explore all your planned destinations on an interactive map
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <FaFilter />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h3 className="text-white font-medium mb-3">Show on map:</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(locationTypes).map(([type, enabled]) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleTypeFilterChange(type as keyof typeof locationTypes)}
                      className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-gray-300 capitalize">{type}s</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{itineraries.length}</div>
            <div className="text-gray-400 text-sm">Total Trips</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{filteredLocations.length}</div>
            <div className="text-gray-400 text-sm">Destinations</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">
              {itineraries.reduce((sum, it) => sum + it.days, 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Days</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">
              {new Set(itineraries.map(it => it.destination.split(',')[0])).size}
            </div>
            <div className="text-gray-400 text-sm">Countries</div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          {filteredLocations.length > 0 ? (
            <Map
              locations={filteredLocations.map(loc => ({
                ...loc,
                onClick: () => handleLocationClick(loc)
              }))}
              height="600px"
              zoom={2}
              showControls={true}
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <FaMap className="text-6xl mb-4 mx-auto opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No locations to display</h3>
                <p>Create some itineraries to see them on the map!</p>
              </div>
            </div>
          )}
        </div>

        {/* Itinerary List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaList className="text-primary" />
            <h2 className="text-xl font-bold text-white">Your Itineraries</h2>
          </div>
          
          {itineraries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itineraries.map((itinerary) => (
                <div
                  key={itinerary.id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedItinerary(itinerary)}
                >
                  <h3 className="font-semibold text-white mb-2">{itinerary.destination}</h3>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>{itinerary.days} days</p>
                    <p>Created: {formatDate(itinerary.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No itineraries found. Create your first trip to get started!</p>
            </div>
          )}
        </div>

        {/* Itinerary Detail Modal */}
        {selectedItinerary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedItinerary.destination}
                    </h2>
                    <p className="text-gray-400">
                      {selectedItinerary.days} days • Created {formatDate(selectedItinerary.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedItinerary(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="mb-6">
                  <Map
                    itinerary={selectedItinerary}
                    height="300px"
                    zoom={10}
                    showControls={false}
                  />
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {selectedItinerary.result}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;