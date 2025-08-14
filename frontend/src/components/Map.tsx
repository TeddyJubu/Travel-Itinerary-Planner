import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Itinerary } from '../types';

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

// Interface for Google Map component props
interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  locations: Location[];
  height: string;
  showControls: boolean;
  onLocationClick?: (location: Location) => void;
}

/**
 * Google Maps component that renders the actual map
 * Uses Google Maps JavaScript API for enhanced functionality
 */
const GoogleMapComponent: React.FC<GoogleMapProps> = ({
  center,
  zoom,
  locations,
  height,
  showControls,
  onLocationClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<any>(null);

  /**
   * Initialize Google Map when component mounts
   */
  useEffect(() => {
    if (mapRef.current && !map && (window as any).google) {
      const google = (window as any).google;
      const newMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: showControls,
        streetViewControl: showControls,
        fullscreenControl: showControls,
        zoomControl: showControls,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ color: '#1f2937' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry.fill',
            stylers: [{ color: '#374151' }]
          }
        ]
      });
      
      setMap(newMap);
      setInfoWindow(new google.maps.InfoWindow());
    }
  }, [center, zoom, showControls, map]);

  /**
   * Get marker icon based on location type
   */
  const getMarkerIcon = useCallback((type: Location['type']) => {
    const iconColors = {
      destination: '#ef4444', // red
      activity: '#3b82f6',    // blue
      restaurant: '#10b981',  // green
      hotel: '#f59e0b'        // yellow
    };

    const google = (window as any).google;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="${iconColors[type]}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16)
    };
  }, []);

  /**
   * Create and manage markers on the map
   */
  useEffect(() => {
    if (!map || !infoWindow || !(window as any).google) {
      return;
    }

    const google = (window as any).google;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = locations.map(location => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map,
        title: location.name,
        icon: getMarkerIcon(location.type),
        animation: google.maps.Animation.DROP
      });

      // Add click listener for info window
      marker.addListener('click', () => {
        const content = `
          <div style="color: #1f2937; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${location.name}</h3>
            ${location.description ? `<p style="margin: 0 0 8px 0; color: #6b7280;">${location.description}</p>` : ''}
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                background-color: ${location.type === 'destination' ? '#fee2e2' : 
                                   location.type === 'activity' ? '#dbeafe' :
                                   location.type === 'restaurant' ? '#d1fae5' : '#fef3c7'};
                color: ${location.type === 'destination' ? '#dc2626' :
                         location.type === 'activity' ? '#2563eb' :
                         location.type === 'restaurant' ? '#059669' : '#d97706'};
              ">${location.type}</span>
              ${location.day ? `<span style="font-size: 12px; color: #6b7280;">Day ${location.day}</span>` : ''}
            </div>
          </div>
        `;
        
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
        
        // Call onClick handler if provided
        if (onLocationClick) {
          onLocationClick(location);
        }
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Fit map bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom() && map.getZoom() > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, locations, markers, infoWindow, getMarkerIcon, onLocationClick]);

  return <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg" />;
};

/**
 * Extract locations from itinerary text using Google Places API
 * Enhanced location extraction with better accuracy
 */
const extractLocationsFromText = async (text: string, destination: string): Promise<Location[]> => {
  const locations: Location[] = [];
  
  try {
    // Add main destination using Google Geocoding
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
    
    // Enhanced location extraction patterns
    const locationPatterns = [
      /(?:visit|explore|see|go to|check out)\s+([A-Z][a-zA-Z\s]+(?:Museum|Gallery|Park|Temple|Church|Cathedral|Palace|Castle|Tower|Bridge|Market|Square|Garden|Beach|Lake|Mountain|Hill|Center|Centre|Stadium|Theater|Theatre|Library|University|College))/gi,
      /(?:dine at|eat at|lunch at|dinner at)\s+([A-Z][a-zA-Z\s]+(?:Restaurant|Cafe|Bar|Bistro|Eatery|Kitchen|Grill|House))/gi,
      /(?:stay at|hotel)\s+([A-Z][a-zA-Z\s]+(?:Hotel|Inn|Lodge|Resort|Hostel|Suites?))/gi,
      /([A-Z][a-zA-Z\s]{2,30}(?:Museum|Gallery|Park|Temple|Church|Cathedral|Palace|Castle|Tower|Bridge|Market|Square|Garden|Beach|Lake|Mountain|Hill|Center|Centre|Stadium|Theater|Theatre|Library|University|College|Restaurant|Cafe|Bar|Bistro|Hotel|Inn|Lodge|Resort))/gi
    ];
    
    const extractedNames = new Set<string>();
    
    // Extract location names from text
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const locationName = match
            .replace(/^(?:visit|explore|see|go to|check out|dine at|eat at|lunch at|dinner at|stay at|hotel)\s+/i, '')
            .trim();
          
          if (locationName.length > 3 && !extractedNames.has(locationName.toLowerCase())) {
            extractedNames.add(locationName.toLowerCase());
          }
        });
      }
    });
    
    // Geocode extracted locations (limit to prevent API overuse)
    const limitedNames = Array.from(extractedNames).slice(0, 10);
    
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

/**
 * Geocode location using Google Geocoding API
 * More accurate than OpenStreetMap Nominatim
 */
const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    if (!(window as any).google) {
      console.warn('Google Maps not loaded yet');
      return null;
    }

    const google = (window as any).google;
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address: locationName }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.warn(`Geocoding failed for ${locationName}: ${status}`);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Determine location type based on name
 * Enhanced type detection with more keywords
 */
const getLocationType = (name: string): Location['type'] => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('bar') || 
      lowerName.includes('bistro') || lowerName.includes('eatery') || lowerName.includes('kitchen') ||
      lowerName.includes('grill') || lowerName.includes('dine')) {
    return 'restaurant';
  }
  
  if (lowerName.includes('hotel') || lowerName.includes('inn') || lowerName.includes('lodge') ||
      lowerName.includes('resort') || lowerName.includes('hostel') || lowerName.includes('suite')) {
    return 'hotel';
  }
  
  return 'activity';
};

/**
 * Render function for different loading states
 */
const renderStatus = (status: Status): React.ReactElement => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-400">Loading Google Maps...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
          <div className="text-center text-gray-400">
            <p className="mb-2">⚠️ Failed to load Google Maps</p>
            <p className="text-sm">Please check your API key configuration</p>
          </div>
        </div>
      );
    default:
      return <div />;
  }
};

/**
 * Main Map component with Google Maps integration
 * Provides robust mapping functionality with enhanced features
 */
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
  
  // Get Google Maps API key from environment
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  /**
   * Extract locations from itinerary when provided
   */
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
  
  // Check for API key
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg" style={{ height }}>
        <div className="text-center text-gray-400">
          <p className="mb-2">⚠️ Google Maps API key not configured</p>
          <p className="text-sm">Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file</p>
        </div>
      </div>
    );
  }
  
  // Default center (will be overridden by bounds fitting if locations exist)
  const defaultCenter: { lat: number; lng: number } = mapLocations.length > 0 
    ? { lat: mapLocations[0].lat, lng: mapLocations[0].lng }
    : { lat: 40.7128, lng: -74.0060 }; // New York as fallback
  
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
      <Wrapper apiKey={apiKey || ''} render={renderStatus} libraries={['places', 'geometry']}>
        <GoogleMapComponent
          center={defaultCenter}
          zoom={zoom}
          locations={mapLocations}
          height={height}
          showControls={showControls}
        />
      </Wrapper>
      
      {/* Legend */}
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