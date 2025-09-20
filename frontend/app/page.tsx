"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  useLoadScript, 
  Autocomplete 
} from "@react-google-maps/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faIndianRupeeSign,
  faClock,
  faLandmark,
  faCalendarAlt,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";

interface ActivityCardProps {
  index: number;
  name: string;
  description: string;
  estimated_cost?: number;
  duration_hours?: number;
  category?: string;
  start_time?: string;
  end_time?: string;
}

interface Activity {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  estimated_cost?: number;
  duration_hours?: number;
  category?: string;
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
  date?: string;
  activities: Activity[];
  total_day_cost?: number;
  weather?: Weather;
}

interface Hotel {
  name: string;
  address: string;
  rating?: number;
  price_level?: number;
  latitude: number;
  longitude: number;
  place_id: string;
  photo_reference?: string;
}

interface RouteDetails {
  distance: string;
  duration: string;
  travel_mode: string;
  estimated_cost?: number;
  polyline?: string;
  steps?: Array<{
    instruction: string;
    distance: string;
    duration: string;
    start_location: object;
    end_location: object;
  }>;
}

interface Itinerary {
  location: string;
  duration: number;
  budget: number;
  theme: string;
  start_date?: string;
  traveler_count?: number;
  preferred_transport?: string;
  from_location?: string;
  to_location?: string;
  user_comments?: string;
  days: ItineraryDay[];
  total_estimated_cost?: number;
  hotels?: Hotel[];
  route_details?: RouteDetails;
}

const libraries: ("places")[] = ["places"];
const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

export default function Home() {
  // Main parameters
  const [location, setLocation] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState(10000);
  const [theme, setTheme] = useState("cultural");
  const [travelerCount, setTravelerCount] = useState(1);
  const [preferredTransport, setPreferredTransport] = useState("driving");
  const [userComments, setUserComments] = useState("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [view, setView] = useState<"list" | "map" | "hotels" | "route">("list");
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");

  const fromAutoRef = useRef<google.maps.places.Autocomplete | null>(null);
  const toAutoRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDAUhNkL--7MVKHtlFuR3acwa7ED-cIoAU",
    libraries,
  });

  // Google Autocomplete Handlers
  const handleFromPlaceChanged = () => {
    const place = fromAutoRef.current?.getPlace();
    if (place && place.formatted_address) {
      setFromLocation(place.formatted_address);
    }
  };
  
  const handleToPlaceChanged = () => {
    const place = toAutoRef.current?.getPlace();
    if (place && place.formatted_address) {
      setToLocation(place.formatted_address);
    }
  };

  const handleGenerate = async () => {
    if (!fromLocation.trim()) { setError("Please enter a start point"); return; }
    if (!toLocation.trim()) { setError("Please enter a destination"); return; }
    if (!startDate.trim()) { setError("Please select a start date"); return; }

    setLoading(true);
    setError(null);
    setItinerary(null);
    setActiveDay(1);

    try {
      const requestBody = {
        location: toLocation, // Backend uses this for backward compatibility
        duration,
        budget,
        theme,
        start_date: startDate,
        traveler_count: travelerCount,
        preferred_transport: preferredTransport,
        from_location: fromLocation,
        to_location: toLocation,
        user_comments: userComments.trim() || undefined,
      };

      console.log("Sending request with comments:", requestBody);

      const response = await fetch("https://tourai-i91r.onrender.com/trip/generate-itinerary", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch itinerary`);
      }

      const data: Itinerary = await response.json();
      console.log("Received itinerary:", data);
      setItinerary(data);
      
      // Set view to list by default, but if no hotels available, don't show hotels tab
      if (data.hotels && data.hotels.length === 0) {
        // Keep current view or set to list
        setView(view === "hotels" ? "list" : view);
      }
      
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "sightseeing": return "🏛️";
      case "food": return "🍽️";
      case "adventure": return "🏔️";
      case "cultural": return "🎭";
      case "shopping": return "🛍️";
      case "nature": return "🌿";
      case "nightlife": return "🌃";
      case "heritage": return "🏰";
      default: return "📍";
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "sightseeing": return "bg-blue-50 border-blue-200";
      case "food": return "bg-orange-50 border-orange-200";
      case "adventure": return "bg-green-50 border-green-200";
      case "cultural": return "bg-purple-50 border-purple-200";
      case "shopping": return "bg-pink-50 border-pink-200";
      case "nature": return "bg-green-50 border-green-200";
      case "nightlife": return "bg-indigo-50 border-indigo-200";
      case "heritage": return "bg-yellow-50 border-yellow-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const formatCurrency = (amount?: number) => (!amount ? "Free" : `₹${amount.toLocaleString()}`);

  const getStarRating = (rating?: number) => {
    if (!rating) return "No rating";
    return "⭐".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "✨" : "");
  };

  const getPriceLevelText = (priceLevel?: number) => {
    if (!priceLevel) return "Price not available";
    return "💰".repeat(priceLevel) + " ".repeat(4 - priceLevel);
  };

  const getTransportIcon = (mode: string) => {
    switch ((mode || "").toLowerCase()) {
      case "driving":
      case "car":
        return "🚗"; 
      case "walking":
        return "🚶"; 
      case "transit":
      case "public transport":
      case "public_transport":
        return "🚌";  
      case "bicycling":
      case "bike":
        return "🚴";  
      case "motorcycle":
        return "🏍️";
      case "flight":
        return "✈️"; 
      default:
        return "🚗"; 
    }
  };

const renderActivityCard = (activity: Activity, index: number) => (
  <div
    key={index}
    className="flex flex-col sm:flex-row rounded-2xl overflow-hidden border shadow-md mb-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
  >
    {/* Left segment - grey background */}
    <div className="bg-gray-800 text-white p-4 sm:p-5 flex flex-col justify-between w-full sm:max-w-md">
      <div>
        {/* Number + Title */}
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex w-8 h-8 items-center justify-center bg-white text-black font-bold rounded-md text-sm sm:text-base">
            {index + 1}
          </div>
          <h5 className="font-bold text-base sm:text-lg line-clamp-1">{activity.name}</h5>
        </div>
        {activity.best_time && (
          <span className="text-white-800 flex items-center gap-1">
            <FontAwesomeIcon icon={faClock} />
            {activity.best_time}
          </span>
        )}
        {/* Short description */}
       
      </div>
    </div>

    {/* Right segment - white background */}
    <div className="bg-white flex-1 p-4 sm:p-5 flex flex-col justify-between">
      {/* Top info row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-center mb-3 sm:mb-4">
        {/* Cost */}
        <div>
          <div className="font-bold text-base sm:text-lg text-orange-500 flex items-center justify-center gap-1">
            <FontAwesomeIcon icon={faIndianRupeeSign} />
            {formatCurrency(activity.estimated_cost)}
          </div>
          <div className="text-xs text-gray-500">Cost</div>
        </div>

        {/* Duration */}
        {activity.duration_hours && (
          <div>
            <div className="font-bold text-base sm:text-lg text-gray-800 flex items-center justify-center gap-1">
              <FontAwesomeIcon icon={faClock} />
              {activity.duration_hours}h
            </div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
        )}

        {/* Category */}
        {activity.category && (
          <div>
            <div className="font-bold text-base sm:text-lg capitalize text-gray-800 flex items-center justify-center gap-1">
              <FontAwesomeIcon icon={faLandmark} />
              {activity.category}
            </div>
            <div className="text-xs text-gray-500">Category</div>
          </div>
        )}
      </div>

      {/* Extra info row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-1 sm:gap-0">
      <p className="text-gray-900 text-xs sm:text-sm leading-relaxed line-clamp-2">
          {activity.description || "No description available."}
        </p>

        {activity.latitude && activity.longitude && (
          <span className="flex items-center gap-1 text-pink-600">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </span>
        )}
      </div>
    </div>
  </div>
);




  const renderHotelCard = (hotel: Hotel, index: number) => (
    <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-lg text-gray-800">{hotel.name}</h4>
        <div className="text-right">
          <div className="text-sm text-yellow-600">
            {getStarRating(hotel.rating)}
          </div>
          <div className="text-xs text-gray-500">
            {hotel.rating?.toFixed(1) || "N/A"}
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-2">📍 {hotel.address}</p>
      
      {hotel.place_id && (
        <div className="mt-2">
          <button 
            onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${hotel.place_id}`, '_blank')}
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            View on Google Maps
          </button>
        </div>
      )}
    </div>
  );

  const renderRouteDetails = () => {
    if (!itinerary?.route_details) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-600">Route details not available</p>
          <p className="text-sm text-gray-500 mt-1">
            Make sure both start and end locations are provided
          </p>
        </div>
      );
    }

    const route = itinerary.route_details;
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          {getTransportIcon(route.travel_mode)} Route Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Distance</div>
            <div className="text-lg font-semibold text-blue-700">{route.distance}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Duration</div>
            <div className="text-lg font-semibold text-green-700">{route.duration}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Mode</div>
            <div className="text-lg font-semibold text-purple-700 capitalize">{route.travel_mode}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Est. Cost</div>
            <div className="text-lg font-semibold text-orange-700">
              {formatCurrency(route.estimated_cost)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getTabCount = () => {
    let count = 2; // Always have list and map
    if (itinerary?.hotels && itinerary.hotels.length > 0) count++;
    if (itinerary?.route_details) count++;
    return count;
  };

  const getTabWidth = () => {
    const count = getTabCount();
    return `${100 / count}%`;
  };

  const getTabPosition = () => {
    const count = getTabCount();
    const width = 100 / count;
    
    if (view === "list") return "0%";
    
    let position = width;
    if (view === "hotels" && itinerary?.hotels && itinerary.hotels.length > 0) return `${position}%`;
    if (itinerary?.hotels && itinerary.hotels.length > 0) position += width;
    
    if (view === "route" && itinerary?.route_details) return `${position}%`;
    if (itinerary?.route_details) position += width;
    
    if (view === "map") return `${position}%`;
    
    return "0%";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br flex flex-col items-center p-6 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-orange-200 opacity-30 rounded-full top-[-80px] left-[-100px] blur-3xl animate-pulse" />
      <div className="absolute w-60 h-60 bg-orange-100 opacity-20 rounded-full bottom-[-40px] right-[-80px] blur-2xl" />

      <div className="text-center mb-8">
        <img 
          src="https://ik.imagekit.io/yme0wx3ee/Alto.%20(1)_RxZxFhFm7.png?updatedAt=1758194824112"
          alt="Travel Planner Logo"
          className="mx-auto mb-4"
        />
        <h1 className="text-gray-800 text-5xl font-bold">Plan your perfect journey with AI</h1>
      </div>

      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-2xl mb-8 border border-orange-100 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Location */}
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">From</label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(auto) => {
                    fromAutoRef.current = auto;
                  }}
                  onPlaceChanged={handleFromPlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Start Point"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="border rounded-xl px-3 py-3 w-full text-md shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500  text-gray-700 transition"
                    disabled={loading}
                    autoComplete="off"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  placeholder="Loading..."
                  disabled
                  className="border rounded-xl px-3 py-3 text-gray-400 w-full"
                />
              )}
            </div>

            {/* To Location */}
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">To</label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(auto) => {
                    toAutoRef.current = auto;
                  }}
                  onPlaceChanged={handleToPlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Destination"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="border rounded-xl px-3 py-3 w-full text-md shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500 text-gray-700 transition"
                    disabled={loading}
                    autoComplete="off"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  placeholder="Loading..."
                  disabled
                  className="border rounded-xl px-3 py-3 text-gray-400 w-full"
                />
              )}
            </div>

            {/* Start Date */}
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition"
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Duration */}
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">Duration (days)</label>
              <input
                type="number"
                min="1"
                max="14"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition"
                disabled={loading}
              />
            </div>

            {/* Budget */}
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">Budget (INR)</label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={budget}
                onChange={(e) => setBudget(Math.max(1000, Number(e.target.value)))}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition"
                disabled={loading}
              />
            </div>

            {/* Number of Travelers */}
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">Number of Travelers</label>
              <input
                type="number"
                min="1"
                max="20"
                value={travelerCount}
                onChange={(e) => setTravelerCount(Math.max(1, Number(e.target.value)))}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition"
                disabled={loading}
              />
            </div>

            {/* Preferred Transport */}
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">Preferred Transport</label>
              <select
                value={preferredTransport}
                onChange={(e) => setPreferredTransport(e.target.value)}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 transition"
                disabled={loading}
              >
                <option value="driving">Car / Driving</option>
                <option value="transit">Public Transport</option>
                <option value="walking">Walking</option>
                <option value="bicycling">Bicycle</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>

            {/* Theme */}
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 transition"
                disabled={loading}
              >
                <option value="cultural">Cultural</option>
                <option value="adventure">Adventure</option>
                <option value="heritage">Heritage</option>
                <option value="nightlife">Nightlife</option>
                <option value="food">Food & Cuisine</option>
                <option value="nature">Nature</option>
                <option value="shopping">Shopping</option>
                <option value="sightseeing">Sightseeing</option>
              </select>
            </div>
          </div>

          {/* User Comments/Preferences - New Field */}
          <div className="mt-6">
            <label className="mb-2 text-sm font-bold text-gray-700 block">
              Additional Preferences & Comments
            </label>
            <textarea
              placeholder="Tell us more about your preferences... e.g., 'I love historical sites and local street food', 'Avoid crowded places', 'Include kid-friendly activities', 'I'm interested in photography spots', etc."
              value={userComments}
              onChange={(e) => setUserComments(e.target.value)}
              className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition resize-none"
              rows={3}
              disabled={loading}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {userComments.length}/500 characters
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Trip"}
            </button>
          </div>
        </form>
      </div>

      {/* Dynamic View Toggle */}
      {itinerary && (
        <div className="mb-8 w-full max-w-3xl mx-auto">
          <div className="flex items-center justify-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg relative overflow-hidden">
            {/* Animated active highlight */}
            <div
              className="absolute h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl transition-all duration-300 shadow-md"
              style={{
                width: getTabWidth(),
                left: getTabPosition(),
              }}
            />

            {/* Tab Buttons */}
            <div className={`grid w-full relative z-10`} style={{ gridTemplateColumns: `repeat(${getTabCount()}, 1fr)` }}>
              <button
                onClick={() => setView("list")}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all ${
                  view === "list" ? "text-white" : "text-gray-600 hover:text-orange-600"
                }`}
              >
                📋 <span>Itinerary</span>
              </button>

              {itinerary.hotels && itinerary.hotels.length > 0 && (
                <button
                  onClick={() => setView("hotels")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all ${
                    view === "hotels" ? "text-white" : "text-gray-600 hover:text-orange-600"
                  }`}
                >
                  🏨 <span>Hotels ({itinerary.hotels.length})</span>
                </button>
              )}

              {itinerary.route_details && (
                <button
                  onClick={() => setView("route")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all ${
                    view === "route" ? "text-white" : "text-gray-600 hover:text-orange-600"
                  }`}
                >
                  🗺️ <span>Route</span>
                </button>
              )}

              <button
                onClick={() => setView("map")}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all ${
                  view === "map" ? "text-white" : "text-gray-600 hover:text-orange-600"
                }`}
              >
                🌍 <span>Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-lg text-gray-700">Generating your personalized itinerary...</p>
          <p className="text-sm text-gray-500 mt-2">Analyzing your preferences and comments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 w-full max-w-4xl">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-xl">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Itinerary Content */}
      {itinerary && !loading && (
        <div className="w-full max-w-6xl">
          {view === "list" ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header with Trip Summary */}
              <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-orange-600 text-white p-6">
                <h2 className="text-3xl font-bold mb-2">
                  🌟 Trip to {itinerary.to_location || itinerary.location}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="opacity-80">Duration:</span> <strong>{itinerary.duration} days</strong>
                  </div>
                  <div>
                    <span className="opacity-80">Budget:</span> <strong>{formatCurrency(itinerary.budget)}</strong>
                  </div>
                  <div>
                    <span className="opacity-80">Estimated Cost:</span> 
                    <strong className="ml-1">{formatCurrency(itinerary.total_estimated_cost)}</strong>
                  </div>
                  <div>
                    <span className="opacity-80">Travelers:</span> <strong>{itinerary.traveler_count || 1}</strong>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="capitalize bg-orange-500/70 px-3 py-1 rounded-full text-xs">
                    {itinerary.theme}
                  </span>
                  {itinerary.preferred_transport && (
                    <span className="capitalize bg-orange-500/70 px-3 py-1 rounded-full text-xs">
                      {getTransportIcon(itinerary.preferred_transport)} {itinerary.preferred_transport}
                    </span>
                  )}
                  {itinerary.start_date && (
                    <span className="bg-orange-500/70 px-3 py-1 rounded-full text-xs">
                      📅 {new Date(itinerary.start_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {/* Show User Comments if provided */}
                {itinerary.user_comments && (
                  <div className="mt-4 bg-orange-500/20 rounded-lg p-3">
                    <div className="text-sm font-medium mb-1">Your Preferences:</div>
                    <div className="text-sm opacity-90 italic">"{itinerary.user_comments}"</div>
                  </div>
                )}
              </div>

              {/* Day Tabs */}
              <div className="border-b bg-gray-50 px-6">
                <div className="flex gap-1 overflow-x-auto py-4">
                  {itinerary.days.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                        activeDay === day.day
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-100 border"
                      }`}
                    >
                      Day {day.day}
                      {day.total_day_cost && (
                        <div className="text-xs mt-1">
                          {formatCurrency(day.total_day_cost)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Content */}
              <div className="p-6">
                {itinerary.days
                  .filter(day => day.day === activeDay)
                  .map((day) => (
                    <div key={day.day}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          📅 Day {day.day}
                          <span className="text-lg text-gray-500">
                            ({day.activities.length} activities)
                          </span>
                        </h3>
                        {day.total_day_cost && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Day Total</div>
                            <div className="text-xl font-bold text-orange-600">
                              {formatCurrency(day.total_day_cost)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Weather Card */}
                      {day.weather && (
                        <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">
                              {day.weather.condition.includes("Rain")
                                ? "🌧️"
                                : day.weather.condition.includes("Cloud")
                                ? "⛅"
                                : "☀️"}
                            </span>
                            <div>
                              <div className="text-sm text-gray-500">{day.weather.date}</div>
                              <div className="font-semibold text-gray-700">
                                {day.weather.condition}
                              </div>
                              <div className="text-sm text-gray-600">
                                {day.weather.min_temp_c}°C - {day.weather.max_temp_c}°C
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-blue-700 font-medium">
                            🌧 Chance of Rain: {day.weather.chance_of_rain}%
                          </div>
                        </div>
                      )}

                      {/* Activities */}
                      <div className="space-y-4">
                        {day.activities.map((activity, index) =>
                          renderActivityCard(activity, index)
                        )}
                      </div>

                      {day.activities.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-4xl mb-2">📝</div>
                          <p>No activities planned for this day</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Navigation */}
              <div className="border-t bg-gray-50 p-4 flex justify-between">
                <button
                  onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
                  disabled={activeDay === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 
                   hover:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ← Previous Day
                </button>
                <span className="text-sm text-gray-500 self-center">
                  Day {activeDay} of {itinerary.duration}
                </span>
                <button
                  onClick={() => setActiveDay(Math.min(itinerary.duration, activeDay + 1))}
                  disabled={activeDay === itinerary.duration}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 
                   hover:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next Day →
                </button>
              </div>
            </div>
          ) : view === "hotels" ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">🏨 Recommended Hotels</h3>
                <p className="text-gray-600">Hotels near your destination</p>
              </div>
              
              {itinerary.hotels && itinerary.hotels.length > 0 ? (
                <div className="grid gap-4">
                  {itinerary.hotels.map((hotel, index) => renderHotelCard(hotel, index))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">🏨</div>
                  <p>No hotels found for this destination</p>
                  <p className="text-sm mt-1">Try a different location or check back later</p>
                </div>
              )}
            </div>
          ) : view === "route" ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">🗺️ Travel Route</h3>
                <p className="text-gray-600">Route from {itinerary.from_location} to {itinerary.to_location}</p>
              </div>
              {renderRouteDetails()}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-orange-600 text-white p-4">
                <h3 className="text-xl font-bold">🗺️ Interactive Map View</h3>
                <p className="text-sm opacity-90">Explore your itinerary locations</p>
              </div>
              <MapView itinerary={itinerary} activeDay={activeDay} />
              
              {/* Day selector for map */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2 justify-center flex-wrap">
                  {itinerary.days.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        activeDay === day.day
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      Day {day.day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}