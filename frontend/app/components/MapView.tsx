"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";

// Fix Leaflet default markers by importing CSS and setting up icons
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Type definitions matching the backend response
interface Activity {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  estimated_cost?: number;
  duration_hours?: number;
  category?: string;
}

interface ItineraryDay {
  day: number;
  activities: Activity[];
  total_day_cost?: number;
}

interface Itinerary {
  location: string;
  duration: number;
  budget: number;
  theme: string;
  days: ItineraryDay[];
  total_estimated_cost?: number;
}

type MapProps = {
  itinerary: Itinerary;
  activeDay?: number;
  showAllDays?: boolean;
};

// Component to handle map center updates
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);

  return null;
}

// Default coordinates for fallback
const DEFAULT_COORDINATES: Record<string, [number, number]> = {
  jaipur: [26.9124, 75.7873],
  bangalore: [12.9716, 77.5946],
  mumbai: [19.0760, 72.8777],
  delhi: [28.7041, 77.1025],
  goa: [15.2993, 74.1240],
  kerala: [10.8505, 76.2711],
  paris: [48.8566, 2.3522],
  london: [51.5074, -0.1278],
  tokyo: [35.6762, 139.6503],
  "new york": [40.7128, -74.0060],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.3850, 78.4867],
  pune: [18.5204, 73.8567],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  surat: [21.1702, 72.8311],
  rajasthan: [27.0238, 74.2179],
  udaipur: [24.5854, 73.7125],
  jodhpur: [26.2389, 73.0243],
  agra: [27.1767, 78.0081],
  varanasi: [25.3176, 82.9739],
  amritsar: [31.6340, 74.8723],
  cochin: [9.9312, 76.2673],
  mysore: [12.2958, 76.6394],
  ooty: [11.4064, 76.6932]
};

const createNumberedIcon = (number: number, category?: string, isActive: boolean = true) => {
  const getIconColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "sightseeing": return "#4f46e5"; // indigo
      case "food": return "#f97316"; // orange
      case "adventure": return "#059669"; // emerald
      case "cultural": return "#7c3aed"; // violet
      case "shopping": return "#ec4899"; // pink
      case "nature": return "#16a34a"; // green
      case "nightlife": return "#f59e0b"; // amber
      case "heritage": return "#9333ea"; // purple
      default: return "#6b7280"; // gray
    }
  };

  const color = getIconColor(category);
  const opacity = isActive ? 1 : 0.6;
  const size = isActive ? 32 : 24;
  const fontSize = isActive ? '11px' : '9px';

  return new L.DivIcon({
    html: `<div style="
      background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
      color: white;
      border-radius: 50%;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: ${fontSize};
      font-family: system-ui, -apple-system, sans-serif;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.1);
      opacity: ${opacity};
      transition: all 0.2s ease;
      cursor: pointer;
    ">${number}</div>`,
    className: "custom-marker-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const getCategoryEmoji = (category?: string) => {
  switch (category?.toLowerCase()) {
    case "sightseeing": return "🏛️";
    case "food": return "🍽️";
    case "adventure": return "🏔️";
    case "cultural": return "🎭";
    case "shopping": return "🛍️";
    case "nature": return "🌿";
    case "nightlife": return "🌙";
    case "heritage": return "🏰";
    default: return "📍";
  }
};

const formatCurrency = (amount?: number) => {
  if (!amount || amount === 0) return "Free";
  return `₹${amount.toLocaleString()}`;
};

export default function MapView({ itinerary, activeDay, showAllDays = false }: MapProps) {
  // Filter activities based on activeDay or show all
  const activitiesWithCoordinates = useMemo(() => {
    const daysToShow = showAllDays 
      ? itinerary.days 
      : itinerary.days.filter(day => !activeDay || day.day === activeDay);

    let activityIndex = 0;
    return daysToShow
      .flatMap((day) => 
        day.activities
          .filter(activity => 
            activity.latitude && 
            activity.longitude && 
            !isNaN(activity.latitude) && 
            !isNaN(activity.longitude) &&
            activity.latitude >= -90 && 
            activity.latitude <= 90 &&
            activity.longitude >= -180 && 
            activity.longitude <= 180
          )
          .map(activity => ({
            ...activity,
            day: day.day,
            isActiveDay: !activeDay || day.day === activeDay,
            globalIndex: ++activityIndex
          }))
      );
  }, [itinerary.days, activeDay, showAllDays]);

  // Calculate map center and bounds
  const { mapCenter, mapZoom } = useMemo(() => {
    if (activitiesWithCoordinates.length === 0) {
      // Fallback to location-based default coordinates
      const locationKey = itinerary.location.toLowerCase().trim();
      
      // Try to find exact match first
      let defaultCoord = DEFAULT_COORDINATES[locationKey];
      
      // If not found, try partial matches
      if (!defaultCoord) {
        const matchingKey = Object.keys(DEFAULT_COORDINATES).find(key => 
          locationKey.includes(key) || key.includes(locationKey)
        );
        defaultCoord = matchingKey ? DEFAULT_COORDINATES[matchingKey] : DEFAULT_COORDINATES.jaipur;
      }
      
      return { mapCenter: defaultCoord, mapZoom: 11 };
    }

    if (activitiesWithCoordinates.length === 1) {
      const activity = activitiesWithCoordinates[0];
      return { 
        mapCenter: [activity.latitude!, activity.longitude!] as [number, number], 
        mapZoom: 14 
      };
    }

    // Calculate bounds for multiple activities
    const lats = activitiesWithCoordinates.map(a => a.latitude!);
    const lngs = activitiesWithCoordinates.map(a => a.longitude!);
    
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
    
    // Calculate zoom based on bounds
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 12;
    if (maxDiff < 0.01) zoom = 15;
    else if (maxDiff < 0.05) zoom = 13;
    else if (maxDiff < 0.1) zoom = 12;
    else if (maxDiff < 0.5) zoom = 10;
    else if (maxDiff < 1) zoom = 9;
    else zoom = 8;

    return { mapCenter: [centerLat, centerLng] as [number, number], mapZoom: zoom };
  }, [activitiesWithCoordinates, itinerary.location]);

  const currentDay = activeDay || 1;
  const activeActivitiesCount = activitiesWithCoordinates.filter(a => a.isActiveDay).length;

  return (
    <div className="relative h-[500px] w-full rounded-lg overflow-hidden bg-gray-100">
      {/* Grey overlay for styling */}
      <div className="absolute inset-0 bg-gray-500/10 z-[1] pointer-events-none rounded-lg"></div>
      
      {/* Map Header */}
      <div className="absolute top-4 left-4 z-[1000] bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-700">
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          📍 {itinerary.location}
        </div>
        <div className="text-xs text-gray-300">
          {showAllDays 
            ? `All Days • ${activitiesWithCoordinates.length} locations`
            : `Day ${currentDay} • ${activeActivitiesCount} locations`
          }
        </div>
      </div>

      {/* Category Legend */}
      {activitiesWithCoordinates.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000] bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-700 max-w-48">
          <div className="text-xs font-semibold text-white mb-2">🎯 Categories</div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {Array.from(new Set(activitiesWithCoordinates.map(a => a.category).filter(Boolean)))
              .slice(0, 6)
              .map(category => (
                <div key={category} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-white/30" 
                    style={{ 
                      backgroundColor: category === 'sightseeing' ? '#4f46e5' :
                                     category === 'food' ? '#f97316' :
                                     category === 'adventure' ? '#059669' :
                                     category === 'cultural' ? '#7c3aed' :
                                     category === 'shopping' ? '#ec4899' :
                                     category === 'nature' ? '#16a34a' :
                                     category === 'nightlife' ? '#f59e0b' :
                                     category === 'heritage' ? '#9333ea' : '#6b7280'
                    }}
                  />
                  <span className="capitalize text-gray-300">{category}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No coordinates message */}
      {activitiesWithCoordinates.length === 0 && (
        <div className="absolute inset-0 z-[1000] bg-gray-900/85 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-white mb-3">
              No Coordinates Available
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              The activities for {showAllDays ? 'this itinerary' : `Day ${currentDay}`} don't have 
              location coordinates yet. The map shows the general area of <strong className="text-white">{itinerary.location}</strong>.
            </p>
            <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              💡 Tip: The AI is still learning to provide coordinates. Future updates will include more precise locations!
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ 
          height: "100%", 
          width: "100%",
          filter: "grayscale(30%) contrast(1.1)",
          backgroundColor: "#f3f4f6"
        }}
        className="z-0 rounded-lg"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Custom grey-tinted tile layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          className="leaflet-tile-pane"
          opacity={0.8}
        />
        
        {/* Alternative darker tile layer option */}
        {/* <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution="&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors"
        /> */}
        
        <MapController center={mapCenter} zoom={mapZoom} />

        {activitiesWithCoordinates.map((activity, index) => (
          <Marker
            key={`${activity.day}-${index}-${activity.globalIndex}`}
            position={[activity.latitude!, activity.longitude!]}
            icon={createNumberedIcon(activity.globalIndex, activity.category, activity.isActiveDay)}
          >
            <Popup 
              maxWidth={320} 
              className="custom-popup"
              closeButton={true}
              autoClose={false}
              keepInView={true}
            >
              <div className="p-3 bg-white rounded-lg">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl">{getCategoryEmoji(activity.category)}</div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-base leading-tight">
                      {activity.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                        Day {activity.day}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        Stop #{activity.globalIndex}
                      </span>
                      {activity.category && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full capitalize">
                          {activity.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {activity.description}
                </p>
                
                {/* Details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {activity.estimated_cost !== undefined && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        💰 {formatCurrency(activity.estimated_cost)}
                      </span>
                    )}
                    {activity.duration_hours && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        ⏰ {activity.duration_hours}h
                      </span>
                    )}
                  </div>
                </div>

                {/* Coordinates */}
                <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200 flex items-center gap-1">
                  <span>📍</span>
                  <span>{activity.latitude?.toFixed(4)}, {activity.longitude?.toFixed(4)}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] flex justify-between items-center">
        {/* Activity Count */}
        {activeActivitiesCount > 0 && (
          <div className="bg-gray-800/90 text-white rounded-full px-4 py-2 text-sm font-semibold shadow-xl border border-gray-700">
            📍 {activeActivitiesCount} location{activeActivitiesCount !== 1 ? 's' : ''} plotted
          </div>
        )}

        {/* Map Controls Info */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-300 shadow-xl border border-gray-700">
          🖱️ Click markers for details • 🔍 Zoom to explore
        </div>
      </div>

      {/* Custom CSS for map styling */}
      <style jsx global>{`
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .leaflet-popup-tip {
          background: white !important;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        
        .leaflet-control-zoom a {
          background-color: rgba(31, 41, 55, 0.9) !important;
          color: white !important;
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
          backdrop-filter: blur(4px);
        }
        
        .leaflet-control-zoom a:hover {
          background-color: rgba(55, 65, 81, 0.9) !important;
          color: white !important;
        }
        
        .custom-marker-icon {
          transition: transform 0.2s ease !important;
        }
        
        .custom-marker-icon:hover {
          transform: scale(1.1) !important;
          z-index: 1000 !important;
        }

        .leaflet-tile-pane {
          filter: grayscale(20%) brightness(0.95) contrast(1.1);
        }
      `}</style>
    </div>
  );
}