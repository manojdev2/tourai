"use client";

import { useEffect, useRef, useMemo } from "react";

// ---------- Types ----------
interface Activity {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  estimated_cost?: number;
  duration_hours?: number;
  category?: string;
  type?: string;
  location?: { lat: number; lng: number };
  cost?: number;
  rating?: number;
  best_time?: string;
}

interface Weather {
  date: string;
  condition: string;
  max_temp_c: number;
  min_temp_c: number;
  chance_of_rain: number;
}

interface ItineraryDay {
  day: number;
  activities: Activity[];
  total_day_cost?: number;
  weather?: Weather;
  accommodation?: {
    name: string;
    type: string;
    price: number;
    rating: number;
  };
  total_cost?: number;
  notes?: string;
  travel_time?: number;
}

interface Itinerary {
  location: string;
  destination?: string;
  from_location?: string;
  to_location?: string;
  duration: number;
  budget: number;
  themes: string[];
  days: ItineraryDay[];
  total_estimated_cost?: number;
  total_cost?: number;
  weather_summary?: any;
  transportation_info?: any;
}

type MapProps = {
  itinerary: Itinerary;
  activeDay?: number;
  showAllDays?: boolean;
};

// ---------- Default coordinates with expanded list ----------
const DEFAULT_COORDINATES: Record<string, [number, number]> = {
  jaipur: [26.9124, 75.7873],
  bangalore: [12.9716, 77.5946],
  mumbai: [19.076, 72.8777],
  delhi: [28.7041, 77.1025],
  goa: [15.2993, 74.124],
  kerala: [10.8505, 76.2711],
  paris: [48.8566, 2.3522],
  london: [51.5074, -0.1278],
  tokyo: [35.6762, 139.6503],
  "new york": [40.7128, -74.006],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  surat: [21.1702, 72.8311],
  rajasthan: [27.0238, 74.2179],
  udaipur: [24.5854, 73.7125],
  jodhpur: [26.2389, 73.0243],
  agra: [27.1767, 78.0081],
  varanasi: [25.3176, 82.9739],
  amritsar: [31.634, 74.8723],
  cochin: [9.9312, 76.2673],
  kochi: [9.9312, 76.2673],
  mysore: [12.2958, 76.6394],
  ooty: [11.4064, 76.6932],
  manali: [32.2432, 77.1892],
  shimla: [31.1048, 77.1734],
  darjeeling: [27.036, 88.2627],
  rishikesh: [30.0869, 78.2676],
  haridwar: [29.9457, 78.1642],
  pushkar: [26.4899, 74.5513],
  mount_abu: [24.5925, 72.7156],
  kasol: [32.0115, 77.3109],
  mcleodganj: [32.219, 76.3234],
  leh: [34.1526, 77.5771],
  srinagar: [34.0837, 74.7973],
  hampi: [15.335, 76.46],
  coorg: [12.3375, 75.8069],
  munnar: [10.0889, 77.0595],
  alleppey: [9.4981, 76.3388],
  thekkady: [9.5916, 77.1594],
};

// ---------- Category Colors and Emojis ----------
const getIconColor = (category?: string, type?: string) => {
  const cat = (category || type || "").toLowerCase();
  switch (cat) {
    case "sightseeing":
      return "#4f46e5"; // Indigo
    case "food":
      return "#f97316"; // Orange
    case "adventure":
      return "#059669"; // Emerald
    case "cultural":
      return "#7c3aed"; // Violet
    case "shopping":
      return "#ec4899"; // Pink
    case "nature":
      return "#16a34a"; // Green
    case "nightlife":
      return "#f59e0b"; // Amber
    case "heritage":
      return "#9333ea"; // Purple
    case "relaxation":
      return "#06b6d4"; // Cyan
    default:
      return "#6b7280"; // Grey
  }
};

const getCategoryEmoji = (category?: string, type?: string) => {
  const cat = (category || type || "").toLowerCase();
  switch (cat) {
    case "sightseeing":
      return "🏛️";
    case "food":
      return "🍽️";
    case "adventure":
      return "🏔️";
    case "cultural":
      return "🎭";
    case "shopping":
      return "🛍️";
    case "nature":
      return "🌿";
    case "nightlife":
      return "🌙";
    case "heritage":
      return "🏰";
    case "relaxation":
      return "🧘";
    default:
      return "📍";
  }
};

const formatCurrency = (amount?: number) => {
  if (!amount || amount === 0) return "Free";
  return `₹${amount.toLocaleString()}`;
};

// ---------- Map Styles ----------
const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] }, // Very light grey background
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] }, // Slate grey labels
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }], // Light grey roads
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#cbd5e1" }], // Slightly darker for highways
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#bfdbfe" }], // Light blue water
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#f1f5f9" }], // Very light grey for POI
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#cbd5e1" }],
  },
];

export default function MapView({
  itinerary,
  activeDay,
  showAllDays = false,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow>(null);

  // Get destination from multiple possible fields
  const destination =
    itinerary.destination ||
    itinerary.to_location ||
    itinerary.location ||
    "Unknown";

  // ---------- Filter activities with better coordinate handling ----------
  const activitiesWithCoordinates = useMemo(() => {
    const daysToShow = showAllDays
      ? itinerary.days
      : itinerary.days.filter((day) => !activeDay || day.day === activeDay);

    let activityIndex = 0;
    return daysToShow.flatMap((day) =>
      day.activities
        .filter((activity) => {
          // Handle both formats: activity.latitude/longitude and activity.location.lat/lng
          const lat = activity.latitude || activity.location?.lat;
          const lng = activity.longitude || activity.location?.lng;

          return (
            lat !== undefined &&
            lng !== undefined &&
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
          );
        })
        .map((activity) => ({
          ...activity,
          // Normalize coordinates
          latitude: activity.latitude || activity.location?.lat!,
          longitude: activity.longitude || activity.location?.lng!,
          // Normalize cost
          estimated_cost: activity.estimated_cost || activity.cost || 0,
          day: day.day,
          isActiveDay: !activeDay || day.day === activeDay,
          globalIndex: ++activityIndex,
        }))
    );
  }, [itinerary.days, activeDay, showAllDays]);

  // ---------- Map center logic ----------
  const { mapCenter, mapZoom } = useMemo(() => {
    if (activitiesWithCoordinates.length === 0) {
      // Enhanced fallback logic
      const locationKey = destination.toLowerCase().trim();

      // Try exact match first
      let defaultCoord = DEFAULT_COORDINATES[locationKey];

      // If not found, try partial matches
      if (!defaultCoord) {
        const matchingKey = Object.keys(DEFAULT_COORDINATES).find(
          (key) => locationKey.includes(key) || key.includes(locationKey)
        );
        defaultCoord = matchingKey
          ? DEFAULT_COORDINATES[matchingKey]
          : DEFAULT_COORDINATES.jaipur;
      }

      return {
        mapCenter: { lat: defaultCoord[0], lng: defaultCoord[1] },
        mapZoom: 11,
      };
    }

    if (activitiesWithCoordinates.length === 1) {
      const a = activitiesWithCoordinates[0];
      return {
        mapCenter: { lat: a.latitude!, lng: a.longitude! },
        mapZoom: 14,
      };
    }

    // Calculate bounds for multiple activities
    const lats = activitiesWithCoordinates.map((a) => a.latitude!);
    const lngs = activitiesWithCoordinates.map((a) => a.longitude!);

    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

    // Calculate appropriate zoom level
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

    return {
      mapCenter: { lat: centerLat, lng: centerLng },
      mapZoom: zoom,
    };
  }, [activitiesWithCoordinates, destination]);

  // ---------- Initialize Google Map ----------
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Create map
    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: mapStyles,
    });

    // Create single info window
    infoWindowRef.current = new google.maps.InfoWindow();

    // ---------- Add markers ----------
    activitiesWithCoordinates.forEach((activity) => {
      const marker = new google.maps.Marker({
        position: { lat: activity.latitude!, lng: activity.longitude! },
        map: mapInstance.current,
        title: activity.name,
        label: {
          text: activity.globalIndex.toString(),
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "bold",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: activity.isActiveDay ? 16 : 12,
          fillColor: getIconColor(activity.category, activity.type),
          fillOpacity: activity.isActiveDay ? 1 : 0.7,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Enhanced info window content
      const infoContent = `
        <div style="max-width: 280px; font-family: system-ui, -apple-system, sans-serif; line-height: 1.4;">
          <!-- Header -->
          <div style="display: flex; align-items: start; gap: 8px; margin-bottom: 8px;">
            <div style="font-size: 18px;">${getCategoryEmoji(
              activity.category,
              activity.type
            )}</div>
            <div style="flex: 1;">
              <div style="font-weight: bold; color: #1f2937; font-size: 14px; margin-bottom: 4px;">
                ${activity.name}
              </div>
              <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
                <span style="background: #4f46e5; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500;">
                  Day ${activity.day}
                </span>
                <span style="background: #e5e7eb; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 10px;">
                  Stop #${activity.globalIndex}
                </span>
                ${
                  activity.category
                    ? `
                <span style="background: #7c3aed; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; text-transform: capitalize;">
                  ${activity.category}
                </span>
                `
                    : ""
                }
              </div>
            </div>
          </div>
          
          <!-- Description -->
          <p style="color: #6b7280; font-size: 12px; margin: 8px 0; line-height: 1.3;">
            ${activity.description}
          </p>
          
          <!-- Details -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0;">
            ${
              activity.estimated_cost !== undefined &&
              activity.estimated_cost > 0
                ? `
            <span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
              💰 ${formatCurrency(activity.estimated_cost)}
            </span>
            `
                : ""
            }
            ${
              activity.duration_hours
                ? `
            <span style="background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
              ⏰ ${activity.duration_hours}h
            </span>
            `
                : ""
            }
            ${
              activity.rating
                ? `
            <span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
              ⭐ ${activity.rating}/5
            </span>
            `
                : ""
            }
            ${
              activity.best_time
                ? `
            <span style="background: #f3e8ff; color: #6b21a8; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
              🕐 ${activity.best_time}
            </span>
            `
                : ""
            }
          </div>

          <!-- Coordinates -->
          <div style="color: #9ca3af; font-size: 10px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 4px;">
            <span>📍</span>
            <span>${activity.latitude!.toFixed(
              4
            )}, ${activity.longitude!.toFixed(4)}</span>
          </div>
        </div>
      `;

      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(infoContent);
        infoWindowRef.current?.open(mapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple markers
    if (activitiesWithCoordinates.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      activitiesWithCoordinates.forEach((activity) => {
        bounds.extend({ lat: activity.latitude!, lng: activity.longitude! });
      });
      mapInstance.current.fitBounds(bounds, 50);
    }
  }, [mapCenter, mapZoom, activitiesWithCoordinates]);

  const currentDay = activeDay || 1;
  const activeActivitiesCount = activitiesWithCoordinates.filter(
    (a) => a.isActiveDay
  ).length;

  return (
    <div className="relative h-[500px] w-full rounded-lg overflow-hidden bg-gray-100">
      {/* Grey overlay for consistent styling */}
      <div className="absolute inset-0 bg-gray-500/10 z-[1] pointer-events-none rounded-lg"></div>

      {/* Map Header */}
      <div className="absolute top-4 left-4 z-[1000] bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-700">
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          📍 {destination}
        </div>
        <div className="text-xs text-gray-300">
          {showAllDays
            ? `All Days • ${activitiesWithCoordinates.length} locations`
            : `Day ${currentDay} • ${activeActivitiesCount} locations`}
        </div>
        {/* {itinerary.from_location && (
          <div className="text-xs text-gray-400 mt-1">
            From: {itinerary.from_location}
          </div>
        )} */}
      </div>

      {/* Category Legend */}
      {activitiesWithCoordinates.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000] bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-700 max-w-48">
          <div className="text-xs font-semibold text-white mb-2">
            🎯 Categories
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {Array.from(
              new Set(
                activitiesWithCoordinates
                  .map((a) => a.category || a.type)
                  .filter(Boolean)
              )
            )
              .slice(0, 6)
              .map((category) => (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white/30"
                    style={{ backgroundColor: getIconColor(category) }}
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
              The activities for{" "}
              {showAllDays ? "this itinerary" : `Day ${currentDay}`} don't have
              location coordinates yet. The map shows the general area of{" "}
              <strong className="text-white">{destination}</strong>.
            </p>
            <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              💡 Tip: The AI is still learning to provide coordinates. Future
              updates will include more precise locations!
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Bottom Info Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] flex justify-between items-center">
        {/* Activity Count */}
        {activeActivitiesCount > 0 && (
          <div className="bg-gray-800/90 text-white rounded-full px-4 py-2 text-sm font-semibold shadow-xl border border-gray-700">
            📍 {activeActivitiesCount} location
            {activeActivitiesCount !== 1 ? "s" : ""} plotted
          </div>
        )}

        {/* Map Controls Info */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-300 shadow-xl border border-gray-700">
          🖱️ Click markers for details • 🔍 Zoom to explore
        </div>
      </div>

      {/* Weather info for active day */}
      {!showAllDays && activeDay && itinerary.days[activeDay - 1]?.weather && (
        <div className="absolute top-20 left-4 z-[1000] bg-blue-800/90 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-blue-700">
          <div className="text-xs text-blue-200 flex items-center gap-2">
            <span>🌤️</span>
            <span>{itinerary.days[activeDay - 1].weather?.condition}</span>
            <span>
              {Math.round(
                itinerary.days[activeDay - 1].weather?.min_temp_c || 0
              )}
              °-
              {Math.round(
                itinerary.days[activeDay - 1].weather?.max_temp_c || 0
              )}
              °C
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
