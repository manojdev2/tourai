"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  useLoadScript, 
  Autocomplete 
} from "@react-google-maps/api";

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
      const response = await fetch("http://localhost:8000/trip/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: toLocation, // Use toLocation as the main location for backward compatibility
          duration,
          budget,
          theme,
          start_date: startDate,
          traveler_count: travelerCount,
          preferred_transport: preferredTransport,
          from_location: fromLocation,
          to_location: toLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch itinerary`);
      }

      const data: Itinerary = await response.json();
      setItinerary(data);
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
      return "🚌";  
    case "bicycling":
      return "🚴";  
    case "ride":
      return "🚕";  
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
      className={`border-2 rounded-xl p-5 mb-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${getCategoryColor(activity.category)}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getCategoryIcon(activity.category)}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-lg text-gray-800">{activity.name}</h4>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600">
                {formatCurrency(activity.estimated_cost)}
              </div>
              {activity.duration_hours && (
                <div className="text-xs text-gray-500">
                  {activity.duration_hours}h
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            {activity.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {activity.category && (
              <span className="capitalize bg-white px-2 py-1 rounded-full">
                {activity.category}
              </span>
            )}
            {activity.latitude && activity.longitude && (
              <span className="flex items-center gap-1">
                📍 {activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}
              </span>
            )}
          </div>
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
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {getPriceLevelText(hotel.price_level)}
        </span>
        <span className="text-xs text-gray-400">
          {hotel.latitude.toFixed(4)}, {hotel.longitude.toFixed(4)}
        </span>
      </div>
    </div>
  );

  const renderRouteDetails = () => {
    if (!itinerary?.route_details) return null;

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

        {route.steps && route.steps.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Key Directions:</h4>
            <div className="space-y-2">
              {route.steps.slice(0, 5).map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: step.instruction }} />
                    <div className="text-xs text-gray-500 mt-1">
                      {step.distance} • {step.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // return (
  //   <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50 flex flex-col items-center p-6 relative overflow-hidden">
  //     {/* Decorative background shapes */}
  //     <div className="absolute w-96 h-96 bg-blue-200 opacity-30 rounded-full top-[-80px] left-[-100px] blur-3xl animate-pulse" />
  //     <div className="absolute w-60 h-60 bg-purple-100 opacity-20 rounded-full bottom-[-40px] right-[-80px] blur-2xl" />

  //     <h1 className="text-4xl font-extrabold text-gray-800 mb-8 drop-shadow-lg flex items-center gap-2 relative z-10">
  //       <svg
  //         className="w-8 h-8 text-blue-400"
  //         fill="currentColor"
  //         viewBox="0 0 20 20"
  //         xmlns="http://www.w3.org/2000/svg"
  //       >
  //         <path d="M10 2a6 6 0 100 12 6 6 0 000-12zM10 0a8 8 0 110 16A8 8 0 0110 0z" />
  //       </svg>
  //       AI Trip Planner
  //     </h1>

  //     <div className="bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-8 w-full max-w-2xl mb-8 border border-blue-100 relative z-10 transition duration-300">
  //       <form
  //         onSubmit={(e) => {
  //           e.preventDefault();
  //           handleGenerate();
  //         }}
  //       >
  //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //           {/* From Location */}
  //           <div className="flex flex-col w-full">
  //             <label className="mb-2 text-sm font-bold text-gray-700">From</label>
  //             {isLoaded ? (
  //               <div className="relative">
  //                 <Autocomplete
  //                   onLoad={(auto) => {
  //                     fromAutoRef.current = auto;
  //                   }}
  //                   onPlaceChanged={handleFromPlaceChanged}
  //                 >
  //                   <input
  //                     type="text"
  //                     placeholder="Start Point"
  //                     value={fromLocation}
  //                     onChange={(e) => setFromLocation(e.target.value)}
  //                     className="pl-10 border rounded-xl px-3 py-3 w-full text-md shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-500 transition"
  //                     disabled={loading}
  //                     autoComplete="off"
  //                   />
  //                 </Autocomplete>
  //               </div>
  //             ) : (
  //               <input
  //                 type="text"
  //                 placeholder="Loading..."
  //                 disabled
  //                 className="border rounded-xl px-3 py-3 text-gray-400 w-full"
  //               />
  //             )}
  //           </div>

  //           {/* To Location */}
  //           <div className="flex flex-col w-full">
  //             <label className="mb-2 text-sm font-bold text-gray-700">To</label>
  //             {isLoaded ? (
  //               <div className="relative">
  //                 <Autocomplete
  //                   onLoad={(auto) => {
  //                     toAutoRef.current = auto;
  //                   }}
  //                   onPlaceChanged={handleToPlaceChanged}
  //                 >
  //                   <input
  //                     type="text"
  //                     placeholder="Destination"
  //                     value={toLocation}
  //                     onChange={(e) => setToLocation(e.target.value)}
  //                     className="pl-10 border rounded-xl px-3 py-3 w-full text-md shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-500 transition"
  //                     disabled={loading}
  //                     autoComplete="off"
  //                   />
  //                 </Autocomplete>
  //               </div>
  //             ) : (
  //               <input
  //                 type="text"
  //                 placeholder="Loading..."
  //                 disabled
  //                 className="border rounded-xl px-3 py-3 text-gray-400 w-full"
  //               />
  //             )}
  //           </div>

  //           {/* Start Date */}
  //           <div className="flex flex-col w-full">
  //             <label className="mb-2 text-sm font-bold text-gray-700">Start Date</label>
  //             <input
  //               type="date"
  //               value={startDate}
  //               onChange={(e) => setStartDate(e.target.value)}
  //               className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500 transition"
  //               disabled={loading}
  //               min={new Date().toISOString().split("T")[0]}
  //             />
  //           </div>

  //           {/* Duration */}
  //           <div className="flex flex-col w-full">
  //             <label className="mb-2 text-sm font-bold text-gray-700">Duration (days)</label>
  //             <input
  //               type="number"
  //               min="1"
  //               max="14"
  //               value={duration}
  //               onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
  //               className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500 transition"
  //               disabled={loading}
  //             />
  //           </div>

  //           {/* Budget */}
  //           <div className="flex flex-col w-full">
  //             <label className="mb-2 text-sm font-bold text-gray-700">Budget (INR)</label>
  //             <input
  //               type="number"
  //               min="1000"
  //               step="1000"
  //               value={budget}
  //               onChange={(e) => setBudget(Math.max(1000, Number(e.target.value)))}
  //               className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500 transition"
  //               disabled={loading}
  //             />
  //           </div>

  //           {/* Number of Travelers */}
  //           <div className="flex flex-col w-full">
  //             <label className="mb-2 text-sm font-bold text-gray-700">Number of Travelers</label>
  //             <input
  //               type="number"
  //               min="1"
  //               max="20"
  //               value={travelerCount}
  //               onChange={(e) => setTravelerCount(Math.max(1, Number(e.target.value)))}
  //               className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500 transition"
  //               disabled={loading}
  //             />
  //           </div>

  //           {/* Preferred Transport */}
  //           <div className="flex flex-col w-full">
  //             <label className="mb-2 text-sm font-bold text-gray-700">Preferred Transport</label>
  //             <select
  //               value={preferredTransport}
  //               onChange={(e) => setPreferredTransport(e.target.value)}
  //               className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 transition"
  //               disabled={loading}
  //             >
  //               <option value="driving">Car / Driving</option>
  //               <option value="transit">Public Transport</option>
  //               <option value="motorcycle">Motorcycle</option>
  //               <option value="flight">Flight</option>
  //             </select>
  //           </div>

  //           {/* Theme */}
  //           <div className="flex flex-col w-full">
  //             <label className="mb-2 text-sm font-bold text-gray-700">Theme</label>
  //             <select
  //               value={theme}
  //               onChange={(e) => setTheme(e.target.value)}
  //               className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 transition"
  //               disabled={loading}
  //             >
  //               <option value="cultural">Cultural</option>
  //               <option value="adventure">Adventure</option>
  //               <option value="heritage">Heritage</option>
  //               <option value="nightlife">Nightlife</option>
  //               <option value="food">Food &amp; Cuisine</option>
  //               <option value="nature">Nature</option>
  //               <option value="shopping">Shopping</option>
  //             </select>
  //           </div>
  //         </div>

  //         <div className="flex justify-end mt-8">
  //           <button
  //             type="submit"
  //             disabled={loading}
  //             className="w-full md:w-auto bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white font-bold px-8 py-3 rounded-xl shadow-xl hover:scale-105 hover:shadow-2xl transition transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  //           >
  //             {loading ? "Generating..." : "Generate Trip"}
  //           </button>
  //         </div>
  //       </form>
  //     </div>

  //     {/* View Toggle */}
  //     {itinerary && (
  //       <div className="mb-6 bg-white rounded-lg shadow p-1 flex flex-wrap gap-1">
  //         <button
  //           onClick={() => setView("list")}
  //           className={`px-4 py-2 rounded-md transition-all text-sm ${
  //             view === "list"
  //               ? "bg-indigo-600 text-white shadow-md"
  //               : "text-gray-600 hover:bg-gray-100"
  //           }`}
  //         >
  //           📋 Itinerary
  //         </button>
  //         {itinerary.hotels && itinerary.hotels.length > 0 && (
  //           <button
  //             onClick={() => setView("hotels")}
  //             className={`px-4 py-2 rounded-md transition-all text-sm ${
  //               view === "hotels"
  //                 ? "bg-indigo-600 text-white shadow-md"
  //                 : "text-gray-600 hover:bg-gray-100"
  //             }`}
  //           >
  //             🏨 Hotels ({itinerary.hotels.length})
  //           </button>
  //         )}
  //         {itinerary.route_details && (
  //           <button
  //             onClick={() => setView("route")}
  //             className={`px-4 py-2 rounded-md transition-all text-sm ${
  //               view === "route"
  //                 ? "bg-indigo-600 text-white shadow-md"
  //                 : "text-gray-600 hover:bg-gray-100"
  //             }`}
  //           >
  //             🗺️ Route
  //           </button>
  //         )}
  //         <button
  //           onClick={() => setView("map")}
  //           className={`px-4 py-2 rounded-md transition-all text-sm ${
  //             view === "map"
  //               ? "bg-indigo-600 text-white shadow-md"
  //               : "text-gray-600 hover:bg-gray-100"
  //           }`}
  //         >
  //           🌍 Map View
  //         </button>
  //       </div>
  //     )}

  //     {/* Loading State */}
  //     {loading && (
  //       <div className="text-center py-12">
  //         <div className="animate-spin text-4xl mb-4">⏳</div>
  //         <p className="text-lg text-gray-700">Generating your personalized itinerary...</p>
  //         <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
  //       </div>
  //     )}

  //     {/* Error State */}
  //     {error && (
  //       <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 w-full max-w-4xl">
  //         <div className="flex items-center gap-2 text-red-700">
  //           <span className="text-xl">⚠️</span>
  //           <p className="font-medium">{error}</p>
  //         </div>
  //       </div>
  //     )}

  //     {/* Itinerary Content */}
  //     {itinerary && !loading && (
  //       <div className="w-full max-w-6xl">
  //         {view === "list" ? (
  //           <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
  //             {/* Header with Trip Summary */}
  //             <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
  //               <h2 className="text-3xl font-bold mb-2">
  //                 🌟 Trip to {itinerary.to_location || itinerary.location}
  //               </h2>
  //               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
  //                 <div>
  //                   <span className="opacity-80">Duration:</span> <strong>{itinerary.duration} days</strong>
  //                 </div>
  //                 <div>
  //                   <span className="opacity-80">Budget:</span> <strong>{formatCurrency(itinerary.budget)}</strong>
  //                 </div>
  //                 <div>
  //                   <span className="opacity-80">Estimated Cost:</span> 
  //                   <strong className="ml-1">{formatCurrency(itinerary.total_estimated_cost)}</strong>
  //                 </div>
  //                 <div>
  //                   <span className="opacity-80">Travelers:</span> <strong>{itinerary.traveler_count || 1}</strong>
  //                 </div>
  //               </div>
  //               <div className="mt-3 flex flex-wrap gap-2">
  //                 <span className="capitalize bg-white/20 px-3 py-1 rounded-full text-xs">
  //                   {itinerary.theme}
  //                 </span>
  //                 {itinerary.preferred_transport && (
  //                   <span className="capitalize bg-white/20 px-3 py-1 rounded-full text-xs">
  //                     {getTransportIcon(itinerary.preferred_transport)} {itinerary.preferred_transport}
  //                   </span>
  //                 )}
  //                 {itinerary.start_date && (
  //                   <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
  //                     📅 {new Date(itinerary.start_date).toLocaleDateString()}
  //                   </span>
  //                 )}
  //               </div>
  //             </div>

  //             {/* Day Tabs */}
  //             <div className="border-b bg-gray-50 px-6">
  //               <div className="flex gap-1 overflow-x-auto py-4">
  //                 {itinerary.days.map((day) => (
  //                   <button
  //                     key={day.day}
  //                     onClick={() => setActiveDay(day.day)}
  //                     className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
  //                       activeDay === day.day
  //                         ? "bg-indigo-600 text-white shadow-md"
  //                         : "bg-white text-gray-600 hover:bg-gray-100 border"
  //                     }`}
  //                   >
  //                     Day {day.day}
  //                     {day.total_day_cost && (
  //                       <div className="text-xs mt-1">
  //                         {formatCurrency(day.total_day_cost)}
  //                       </div>
  //                     )}
  //                   </button>
  //                 ))}
  //               </div>
  //             </div>

  //             {/* Day Content */}
  //             <div className="p-6">
  //               {itinerary.days
  //                 .filter(day => day.day === activeDay)
  //                 .map((day) => (
  //                   <div key={day.day}>
  //                     <div className="flex items-center justify-between mb-6">
  //                       <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
  //                         📅 Day {day.day}
  //                         <span className="text-lg text-gray-500">
  //                           ({day.activities.length} activities)
  //                         </span>
  //                       </h3>
  //                       {day.total_day_cost && (
  //                         <div className="text-right">
  //                           <div className="text-sm text-gray-500">Day Total</div>
  //                           <div className="text-xl font-bold text-green-600">
  //                             {formatCurrency(day.total_day_cost)}
  //                           </div>
  //                         </div>
  //                       )}
  //                     </div>

  //                     <div className="space-y-4">
  //                       {day.activities.map((activity, index) => 
  //                         renderActivityCard(activity, index)
  //                       )}
  //                     </div>

  //                     {day.activities.length === 0 && (
  //                       <div className="text-center py-12 text-gray-500">
  //                         <div className="text-4xl mb-2">📝</div>
  //                         <p>No activities planned for this day</p>
  //                       </div>
  //                     )}
  //                   </div>
  //                 ))}
  //             </div>

  //              {/* Navigation */}
  //             <div className="border-t bg-gray-50 p-4 flex justify-between">
  //               <button
  //                 onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
  //                 disabled={activeDay === 1}
  //                 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 
  //                  hover:bg-gray-300 disabled:cursor-not-allowed"
  //               >
  //                 ← Previous Day
  //               </button>
  //               <span className="text-sm text-gray-500 self-center">
  //                 Day {activeDay} of {itinerary.duration}
  //               </span>
  //               <button
  //                 onClick={() => setActiveDay(Math.min(itinerary.duration, activeDay + 1))}
  //                 disabled={activeDay === itinerary.duration}
  //                 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 
  //                  hover:bg-gray-300 disabled:cursor-not-allowed"
  //               >
  //                 Next Day →
  //               </button>
  //             </div>
  //           </div>
  //         ) : view === "hotels" ? (
  //           <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
  //             {itinerary.hotels?.map((hotel, index) => renderHotelCard(hotel, index))}
  //           </div>
  //         ): view === "route" ? (
  //           <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
  //             {renderRouteDetails()}
  //           </div>
  //         ) : (
  //           <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
  //             <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
  //               <h3 className="text-xl font-bold">🗺️ Interactive Map View</h3>
  //               <p className="text-sm opacity-90">Explore your itinerary locations</p>
  //             </div>
  //             <MapView itinerary={itinerary} activeDay={activeDay} />
              
  //             {/* Day selector for map */}
  //             <div className="p-4 border-t bg-gray-50">
  //               <div className="flex gap-2 justify-center">
  //                 {itinerary.days.map((day) => (
  //                   <button
  //                     key={day.day}
  //                     onClick={() => setActiveDay(day.day)}
  //                     className={`px-3 py-1 rounded-lg text-sm transition-all ${
  //                       activeDay === day.day
  //                         ? "bg-indigo-600 text-white"
  //                         : "bg-gray-200 text-gray-600 hover:bg-gray-300"
  //                     }`}
  //                   >
  //                     Day {day.day}
  //                   </button>
  //                 ))}
  //               </div>
  //             </div>
  //           </div>
  //          )}
  //       </div>
  //     )}

  //   </div>
  // );

    return (
    <div className="min-h-screen from-orange-50 via-orange-100 to-yellow-50 flex flex-col items-center p-6 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-orange-200 opacity-30 rounded-full top-[-80px] left-[-100px] blur-3xl animate-pulse" />
      <div className="absolute w-60 h-60 bg-orange-100 opacity-20 rounded-full bottom-[-40px] right-[-80px] blur-2xl" />

         <div className="text-center mb-8">
        <img src="https://ik.imagekit.io/yme0wx3ee/Alto.%20(1)_RxZxFhFm7.png?updatedAt=1758194824112"/>
         <br/>
          <h1 className="text-black-800 text-5xl">Plan your perfect journey with AI</h1>
      </div>

      {/* <div className="bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-8 w-full max-w-2xl mb-8 border border-orange-100 relative z-10 transition duration-300"> */}
        <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-2xl mb-8 border border-orange-100 relative z-10 transition duration-300">
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
                <div className="relative">
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
                      className="pl-10 border rounded-xl px-3 py-3 w-full text-md shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500 transition"
                      disabled={loading}
                      autoComplete="off"
                    />
                  </Autocomplete>
                </div>
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
                <div className="relative">
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
                      className="pl-10 border rounded-xl px-3 py-3 w-full text-md shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500 transition"
                      disabled={loading}
                      autoComplete="off"
                    />
                  </Autocomplete>
                </div>
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
                <option value="motorcycle">Motorcycle</option>
                <option value="flight">Flight</option>
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
                <option value="food">Food &amp; Cuisine</option>
                <option value="nature">Nature</option>
                <option value="shopping">Shopping</option>
              </select>
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

      {/* View Toggle */}
      {itinerary && (
        <div className="mb-6 bg-white rounded-lg shadow p-1 flex flex-wrap gap-1">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-md transition-all text-sm ${
              view === "list"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 Itinerary
          </button>
          {itinerary.hotels && itinerary.hotels.length > 0 && (
            <button
              onClick={() => setView("hotels")}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                view === "hotels"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🏨 Hotels ({itinerary.hotels.length})
            </button>
          )}
          {itinerary.route_details && (
            <button
              onClick={() => setView("route")}
              className={`px-4 py-2 rounded-md transition-all text-sm ${
                view === "route"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🗺️ Route
            </button>
          )}
          <button
            onClick={() => setView("map")}
            className={`px-4 py-2 rounded-md transition-all text-sm ${
              view === "map"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🌍 Map View
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-lg text-gray-700">Generating your personalized itinerary...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
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
              {itinerary.hotels?.map((hotel, index) => renderHotelCard(hotel, index))}
            </div>
          ): view === "route" ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
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
                <div className="flex gap-2 justify-center">
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
