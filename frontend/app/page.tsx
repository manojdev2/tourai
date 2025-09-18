"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

// Type definitions for the API response
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

export default function Home() {
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState(15000);
  const [theme, setTheme] = useState("cultural");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError(null);
    setItinerary(null);
    setActiveDay(1);

    try {
      const response = await fetch("https:/tourai-i91r.onrender.com/trip/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, duration, budget, theme }),
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
      default: return "📍";
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "sightseeing": return "bg-orange-50 border-orange-300 hover:border-orange-400";
      case "food": return "bg-amber-50 border-amber-300 hover:border-amber-400";
      case "adventure": return "bg-orange-100 border-orange-400 hover:border-orange-500";
      case "cultural": return "bg-yellow-50 border-yellow-300 hover:border-yellow-400";
      case "shopping": return "bg-orange-50 border-orange-200 hover:border-orange-300";
      default: return "bg-gray-50 border-gray-300 hover:border-gray-400";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Free";
    return `₹${amount.toLocaleString()}`;
  };

  const renderActivityCard = (activity: Activity, index: number) => (
    <div 
      key={index}
      className={`border-2 rounded-xl p-5 mb-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${getCategoryColor(activity.category)}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl bg-white rounded-full p-2 shadow-sm">
          {getCategoryIcon(activity.category)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-bold text-xl text-gray-800 leading-tight">{activity.name}</h4>
            <div className="text-right">
              <div className="text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                {formatCurrency(activity.estimated_cost)}
              </div>
              {activity.duration_hours && (
                <div className="text-xs text-gray-500 mt-1">
                  {activity.duration_hours}h
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            {activity.description}
          </p>
          <div className="flex items-center gap-4 text-xs">
            {activity.category && (
              <span className="capitalize bg-orange-500 text-white px-3 py-1 rounded-full font-medium">
                {activity.category}
              </span>
            )}
            {activity.latitude && activity.longitude && (
              <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                📍 {activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br flex flex-col items-center p-6">
      <div className="text-center mb-8">
        <img src="https://ik.imagekit.io/yme0wx3ee/Alto.%20(1)_RxZxFhFm7.png?updatedAt=1758194824112"/>
         <br/>
          <h1 className="text-black-800 text-5xl">Plan your perfect journey with AI</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-5xl mb-8 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <input
            type="text"
            placeholder="Location (e.g., Bangalore, Paris)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 
             text-gray-800 placeholder-gray-500 transition-all duration-200"
            disabled={loading}
          />
          <input
            type="number"
            min="1"
            max="14"
            placeholder="Duration (days)"
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
            className="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 
             text-gray-800 placeholder-gray-500 transition-all duration-200"
            disabled={loading}
          />
          <input
            type="number"
            min="1000"
            step="1000"
            placeholder="Budget (INR)"
            value={budget}
            onChange={(e) => setBudget(Math.max(1000, Number(e.target.value)))}
            className="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 
             text-gray-800 placeholder-gray-500 transition-all duration-200"
            disabled={loading}
          />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 
             text-gray-800 transition-all duration-200"
            disabled={loading}
          >
            <option value="cultural">Cultural</option>
            <option value="adventure">Adventure</option>
            <option value="heritage">Heritage</option>
            <option value="nightlife">Nightlife</option>
            <option value="food">Food & Cuisine</option>
            <option value="nature">Nature</option>
            <option value="shopping">Shopping</option>
            <option value="romantic">Romantic</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-gradient-to-r from-[#282828] to-[#282828] text-white px-6 py-3 rounded-xl 
             hover:from-orange-600 hover:to-orange-700 hover:scale-105 transform transition-all duration-200 
             disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:shadow-xl"
          >
            {loading ? "Generating..." : "Generate Trip"}
          </button>
        </div>
      </div>

      {/* View Toggle */}
      {itinerary && (
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
          <button
            onClick={() => setView("list")}
            className={`px-8 py-3 rounded-xl transition-all duration-200 font-semibold ${
              view === "list"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setView("map")}
            className={`px-8 py-3 rounded-xl transition-all duration-200 font-semibold ${
              view === "map"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🗺️ Map View
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin text-6xl mb-6">⏳</div>
          <p className="text-2xl text-gray-700 font-semibold mb-2">Generating your personalized itinerary...</p>
          <p className="text-gray-500">This may take a few moments</p>
          <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto mt-4">
            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-8 w-full max-w-5xl shadow-lg">
          <div className="flex items-center gap-3 text-red-700">
            <span className="text-2xl">⚠️</span>
            <p className="font-semibold text-lg">{error}</p>
          </div>
        </div>
      )}

      {/* Itinerary Content */}
      {itinerary && !loading && (
        <div className="w-full max-w-7xl">
          {view === "list" ? (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Header with Trip Summary */}
              <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-orange-600 text-white p-8">
                <h2 className="text-4xl font-bold mb-4 flex items-center gap-3">
                  🌟 Trip to {itinerary.location}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-orange-200 text-sm mb-1">Duration</div>
                    <div className="text-2xl font-bold">{itinerary.duration} days</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-orange-200 text-sm mb-1">Budget</div>
                    <div className="text-2xl font-bold">{formatCurrency(itinerary.budget)}</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-orange-200 text-sm mb-1">Estimated Cost</div>
                    <div className="text-2xl font-bold">{formatCurrency(itinerary.total_estimated_cost)}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="capitalize bg-orange-500 px-4 py-2 rounded-full text-sm font-semibold">
                    {itinerary.theme} Theme
                  </span>
                </div>
              </div>

              {/* Day Tabs */}
              <div className="border-b bg-gray-50 px-8">
                <div className="flex gap-2 overflow-x-auto py-6">
                  {itinerary.days.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`px-6 py-4 rounded-xl whitespace-nowrap transition-all duration-200 font-semibold ${
                        activeDay === day.day
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105"
                          : "bg-white text-gray-600 hover:bg-gray-100 border-2 border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      Day {day.day}
                      {day.total_day_cost && (
                        <div className="text-xs mt-1 opacity-90">
                          {formatCurrency(day.total_day_cost)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Content */}
              <div className="p-8">
                {itinerary.days
                  .filter(day => day.day === activeDay)
                  .map((day) => (
                    <div key={day.day}>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                          📅 Day {day.day}
                          <span className="text-lg text-gray-500 font-normal">
                            ({day.activities.length} activities)
                          </span>
                        </h3>
                        {day.total_day_cost && (
                          <div className="text-right bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                            <div className="text-sm text-gray-600 mb-1">Day Total</div>
                            <div className="text-2xl font-bold text-orange-600">
                              {formatCurrency(day.total_day_cost)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {day.activities.map((activity, index) => 
                          renderActivityCard(activity, index)
                        )}
                      </div>

                      {day.activities.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                          <div className="text-6xl mb-4">📝</div>
                          <p className="text-xl">No activities planned for this day</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Navigation */}
              <div className="border-t bg-gray-50 p-6 flex justify-between items-center">
                <button
                  onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
                  disabled={activeDay === 1}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold disabled:opacity-50 
                   hover:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  ← Previous Day
                </button>
                <span className="text-gray-600 font-semibold bg-white px-4 py-2 rounded-xl border-2 border-gray-200">
                  Day {activeDay} of {itinerary.duration}
                </span>
                <button
                  onClick={() => setActiveDay(Math.min(itinerary.duration, activeDay + 1))}
                  disabled={activeDay === itinerary.duration}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold disabled:opacity-50 
                   hover:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next Day →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-orange-600 text-white p-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  🗺️ Interactive Map View
                </h3>
                <p className="text-orange-200 mt-2">Explore your itinerary locations</p>
              </div>
              <MapView itinerary={itinerary} activeDay={activeDay} />
              
              {/* Day selector for map */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex gap-3 justify-center flex-wrap">
                  {itinerary.days.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        activeDay === day.day
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
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