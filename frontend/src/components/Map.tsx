import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Itinerary } from '../types';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Interface for location data
interface Location {
  name: string;
  lat: number;
  lng: number;
  type: 'destination' | 'activity' | 'restaurant' | 'hotel';
  description?: string;
  day?: number;
  itineraryId?: number;
  createdAt?: string;
  onClick?: () => void;
}

// Interface for map props
interface MapProps {
  itinerary?: Itinerary;
  locations?: Location[];
  height?: string;
  zoom?: number;
  showControls?: boolean;
}

// Component to fit map bounds to markers
const FitBounds: React.FC<{ locations: Location[] }> = ({ locations }) => {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [locations, map]);
  
  return null;
};

// Function to extract locations from itinerary text using geocoding
const extractLocationsFromText = async (text: string, destination: string): Promise<Location[]> => {
  const locations: Location[] = [];
  
  try {
    // Add main destination
    const mainLocation = await geocodeLocation(destination);
    if (mainLocation) {
      locations.push({
        name: destination,
        lat: mainLocation.lat,
        lng: mainLocation.lng,
        type: 'destination',
        description: `Main destination: ${destination}`
      });
    }
    
    // Extract locations from text using regex patterns
    const locationPatterns = [
      /visit\s+([A-Z][a-zA-Z\s]+(?:Museum|Park|Temple|Church|Cathedral|Palace|Castle|Tower|Bridge|Market|Square|Garden|Beach|Lake|Mountain|Hill))/gi,
      /go\s+to\s+([A-Z][a-zA-Z\s]+(?:Museum|Park|Temple|Church|Cathedral|Palace|Castle|Tower|Bridge|Market|Square|Garden|Beach|Lake|Mountain|Hill))/gi,
      /explore\s+([A-Z][a-zA-Z\s]+(?:Museum|Park|Temple|Church|Cathedral|Palace|Castle|Tower|Bridge|Market|Square|Garden|Beach|Lake|Mountain|Hill))/gi,
      /([A-Z][a-zA-Z\s]+(?:Restaurant|Cafe|Bar|Hotel|Inn|Lodge))/gi
    ];
    
    const extractedNames = new Set<string>();
    
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const locationName = match.replace(/^(visit|go to|explore)\s+/i, '').trim();
          if (locationName.length > 3 && !extractedNames.has(locationName.toLowerCase())) {
            extractedNames.add(locationName.toLowerCase());
          }
        });
      }
    });
    
    // Geocode extracted locations (limit to prevent API overuse)
    const limitedNames = Array.from(extractedNames).slice(0, 8);
    
    for (const locationName of limitedNames) {
      try {
        const coords = await geocodeLocation(`${locationName}, ${destination}`);
        if (coords) {
          locations.push({
            name: locationName,
            lat: coords.lat,
            lng: coords.lng,
            type: getLocationType(locationName),
            description: `Activity location in ${destination}`
          });
        }
      } catch (error) {
        console.warn(`Failed to geocode ${locationName}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error extracting locations:', error);
  }
  
  return locations;
};

// Simple geocoding function using Nominatim (free)
const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
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
    console.error('Geocoding error:', error);
  }
  
  return null;
};

// Function to determine location type based on name
const getLocationType = (name: string): Location['type'] => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('bar')) {
    return 'restaurant';
  }
  if (lowerName.includes('hotel') || lowerName.includes('inn') || lowerName.includes('lodge')) {
    return 'hotel';
  }
  return 'activity';
};

// Function to get marker color based on location type
const getMarkerIcon = (type: Location['type']): L.Icon => {
  const iconColors = {
    destination: '#ef4444', // red
    activity: '#3b82f6',    // blue
    restaurant: '#10b981',  // green
    hotel: '#f59e0b'        // yellow
  };
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${iconColors[type]}"/>
        <circle cx="12.5" cy="12.5" r="6" fill="white"/>
      </svg>
    `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Main Map component
const Map: React.FC<MapProps> = ({ 
  itinerary, 
  locations = [], 
  height = '400px', 
  zoom = 10,
  showControls = true 
}) => {
  const [mapLocations, setMapLocations] = useState<Location[]>(locations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extract locations from itinerary when provided
  useEffect(() => {
    const loadLocations = async () => {
      if (itinerary && !locations.length) {
        setLoading(true);
        setError(null);
        
        try {
          const extractedLocations = await extractLocationsFromText(
            itinerary.result, 
            itinerary.destination
          );
          setMapLocations(extractedLocations);
        } catch (err) {
          setError('Failed to load map locations');
          console.error('Error loading locations:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setMapLocations(locations);
      }
    };
    
    loadLocations();
  }, [itinerary, locations]);
  
  // Default center (will be overridden by FitBounds if locations exist)
  const defaultCenter: [number, number] = mapLocations.length > 0 
    ? [mapLocations[0].lat, mapLocations[0].lng]
    : [40.7128, -74.0060]; // New York as fallback
  
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-400">Loading map locations...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg" style={{ height }}>
        <div className="text-center text-gray-400">
          <p className="mb-2">⚠️ {error}</p>
          <p className="text-sm">Map could not be loaded</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mapLocations.length > 0 && <FitBounds locations={mapLocations} />}
        
        {mapLocations.map((location, index) => (
          <Marker
            key={index}
            position={[location.lat, location.lng]}
            icon={getMarkerIcon(location.type)}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-semibold text-gray-900 mb-1">{location.name}</h3>
                {location.description && (
                  <p className="text-gray-600 mb-2">{location.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    location.type === 'destination' ? 'bg-red-100 text-red-800' :
                    location.type === 'activity' ? 'bg-blue-100 text-blue-800' :
                    location.type === 'restaurant' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {location.type}
                  </span>
                  {location.day && (
                    <span className="text-xs text-gray-500">Day {location.day}</span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {showControls && mapLocations.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="text-sm">
            <h4 className="font-semibold text-gray-900 mb-2">Legend</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Destination</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Activities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Restaurants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700">Hotels</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
export type { Location };