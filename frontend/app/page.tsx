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
      const response = await fetch("http://localhost:8000/trip/generate-itinerary", {
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
      case "sightseeing": return "bg-blue-50 border-blue-200";
      case "food": return "bg-orange-50 border-orange-200";
      case "adventure": return "bg-green-50 border-green-200";
      case "cultural": return "bg-purple-50 border-purple-200";
      case "shopping": return "bg-pink-50 border-pink-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Free";
    return `₹${amount.toLocaleString()}`;
  };

  const renderActivityCard = (activity: Activity, index: number) => (
    <div 
      key={index}
      className={`border-2 rounded-xl p-4 mb-4 transition-all hover:shadow-lg ${getCategoryColor(activity.category)}`}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50 flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-6 drop-shadow-lg flex items-center gap-2">
        AI Trip Planner <span className="text-3xl">🗺️</span>
      </h1>

      {/* Form Card */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Location (e.g., Bangalore, Paris)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 
             text-gray-800 placeholder-gray-500"
            disabled={loading}
          />
          <input
            type="number"
            min="1"
            max="14"
            placeholder="Duration (days)"
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 
             text-gray-800 placeholder-gray-500"
            disabled={loading}
          />
          <input
            type="number"
            min="1000"
            step="1000"
            placeholder="Budget (INR)"
            value={budget}
            onChange={(e) => setBudget(Math.max(1000, Number(e.target.value)))}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 
             text-gray-800 placeholder-gray-500"
            disabled={loading}
          />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 
             text-gray-800"
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
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold px-4 py-2 rounded-lg 
             hover:scale-105 transform transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* View Toggle */}
      {itinerary && (
        <div className="mb-6 bg-white rounded-lg shadow p-1">
          <button
            onClick={() => setView("list")}
            className={`px-6 py-2 rounded-md transition-all ${
              view === "list"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setView("map")}
            className={`px-6 py-2 rounded-md transition-all ${
              view === "map"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🗺️ Map View
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
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
                <h2 className="text-3xl font-bold mb-2">
                  🌟 Trip to {itinerary.location}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
                </div>
                <div className="mt-2">
                  <span className="opacity-80">Theme:</span> 
                  <span className="capitalize bg-white/20 px-2 py-1 rounded-full text-xs ml-2">
                    {itinerary.theme}
                  </span>
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
                          ? "bg-indigo-600 text-white shadow-md"
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
                            <div className="text-xl font-bold text-green-600">
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
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
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
                          ? "bg-indigo-600 text-white"
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