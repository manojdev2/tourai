"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faLandmark,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";

interface Activity {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  estimated_cost?: number;
  duration_hours?: number;
  category?: string;
  best_time?: string;
  bookable?: boolean;
  booking_url?: string;
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
  price_per_night?: number;
  bookable?: boolean;
  booking_url?: string;
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

interface CostBreakdown {
  accommodation: number;
  activities: number;
  transportation: number;
  food: number;
  miscellaneous: number;
  total: number;
}

interface BudgetWarning {
  level: "info" | "warning" | "critical" | "error";
  message: string;
  suggestions: string[];
}

interface Itinerary {
  id?: string;
  location: string;
  duration: number;
  budget: number;
  themes: string[];
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
  cost_breakdown?: CostBreakdown;
  budget_warning?: BudgetWarning;
  shareable_link?: string;
  created_at?: string;
}

interface BookingItem {
  type: "activity" | "hotel" | "transport";
  name: string;
  cost: number;
  day?: number;
  selected: boolean;
  bookable: boolean;
}

interface PaymentDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  email: string;
  phone: string;
}

const libraries: "places"[] = ["places"];
const MapView = dynamic(() => import("../components/MapView"), { ssr: false });

export default function Home() {
  // Main parameters
  const [location, setLocation] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [themes, setThemes] = useState<string[]>(["cultural"]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState(10000);
  const [travelerCount, setTravelerCount] = useState(1);

  const [durationInput, setDurationInput] = useState(duration.toString());
  const [budgetInput, setBudgetInput] = useState(budget.toString());
  const [travelerInput, setTravelerInput] = useState(travelerCount.toString());

  const [preferredTransport, setPreferredTransport] = useState("driving");
  const [userComments, setUserComments] = useState("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [view, setView] = useState<
    "list" | "map" | "hotels" | "route" | "share" | "book"
  >("list");
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");

  // Booking and sharing states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
    email: "",
    phone: "",
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [shareableUrl, setShareableUrl] = useState("");

  const fromAutoRef = useRef<google.maps.places.Autocomplete | null>(null);
  const toAutoRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "AIzaSyDAUhNkL--7MVKHtlFuR3acwa7ED-cIoAU",
    libraries,
  });

  const themeOptions = [
    { value: "cultural", label: "Cultural" },
    { value: "adventure", label: "Adventure" },
    { value: "heritage", label: "Heritage" },
    { value: "nightlife", label: "Nightlife" },
    { value: "food", label: "Food & Cuisine" },
    { value: "nature", label: "Nature" },
    { value: "shopping", label: "Shopping" },
    { value: "sightseeing", label: "Sightseeing" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleThemeToggle = (themeValue: string) => {
    setThemes((prev) => {
      if (prev.includes(themeValue)) {
        return prev.filter((t) => t !== themeValue);
      } else {
        return [...prev, themeValue];
      }
    });
  };

  const removeTheme = (themeValue: string) => {
    setThemes((prev) => prev.filter((t) => t !== themeValue));
  };

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
    setBookingConfirmed(false);
    if (!fromLocation.trim()) {
      setError("Please enter a start point");
      return;
    }
    if (!toLocation.trim()) {
      setError("Please enter a destination");
      return;
    }
    if (!startDate.trim()) {
      setError("Please select a start date");
      return;
    }
    if (duration < 1) {
      setError("Duration must be at least 1 day");
      return;
    }
    if (budget < 1000) {
      setError("Budget must be at least 1000 INR");
      return;
    }
    if (travelerCount < 1) {
      setError("There must be at least 1 traveler");
      return;
    }
    if (themes.length === 0) {
      setError("Please select at least one theme");
      return;
    }

    setLoading(true);
    setError(null);
    setItinerary(null);
    setActiveDay(1);

    try {
      const requestBody = {
        location: toLocation,
        duration: durationInput,
        budget: budgetInput,
        themes,
        start_date: startDate,
        traveler_count: travelerInput,
        preferred_transport: preferredTransport,
        from_location: fromLocation,
        to_location: toLocation,
        user_comments: userComments.trim() || undefined,
      };

      const response = await fetch(
        "http://localhost:8000/trip/generate-itinerary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `HTTP ${response.status}: Failed to fetch itinerary`
        );
      }

      const data: Itinerary = await response.json();

      const shareableId = `trip_${Date.now()}`;
      data.shareable_link = `${window.location.origin}/shared/${shareableId}`;
      data.created_at = new Date().toISOString();

      setItinerary(data);
      generateBookingItems(data);

      if (data.hotels && data.hotels.length === 0) {
        setView(view === "hotels" ? "list" : view);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateBookingItems = (itinerary: Itinerary) => {
    const items: BookingItem[] = [];

    itinerary.days.forEach((day) => {
      day.activities.forEach((activity) => {
        if (activity.estimated_cost && activity.estimated_cost > 0) {
          items.push({
            type: "activity",
            name: activity.name,
            cost: activity.estimated_cost,
            day: day.day,
            selected: true,
            bookable: activity.bookable !== false,
          });
        }
      });
    });

    if (itinerary.route_details?.estimated_cost) {
      items.push({
        type: "transport",
        name: `${itinerary.route_details.travel_mode} transportation`,
        cost: itinerary.route_details.estimated_cost,
        selected: true,
        bookable: true,
      });
    }

    setBookingItems(items);
  };

  const handleBookingItemToggle = (index: number) => {
    setBookingItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const getTotalBookingCost = () => {
    return bookingItems
      .filter((item) => item.selected && item.bookable)
      .reduce((total, item) => total + item.cost, 0);
  };

  const handlePayment = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setBookingConfirmed(true);
    setShowPaymentModal(false);
    setLoading(false);
  };

  const generateShareableUrl = () => {
    if (!itinerary) return;

    const shareData = {
      destination: itinerary.to_location || itinerary.location,
      from: itinerary.from_location,
      duration: itinerary.duration,
      startDate: itinerary.start_date,
      totalCost: itinerary.total_estimated_cost,
    };

    const encodedData = btoa(JSON.stringify(shareData));
    const shareUrl = `${window.location.origin}/share?data=${encodedData}`;
    setShareableUrl(shareUrl);
    setShowShareModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const downloadItinerary = () => {
    if (!itinerary) return;

    const content = generateItineraryPDF();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itinerary-${
      itinerary.to_location || itinerary.location
    }-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateItineraryPDF = () => {
    if (!itinerary) return "";

    let content = `TRAVEL ITINERARY\n`;
    content += `================\n\n`;
    content += `Destination: ${itinerary.to_location || itinerary.location}\n`;
    content += `From: ${itinerary.from_location}\n`;
    content += `Duration: ${itinerary.duration} days\n`;
    content += `Start Date: ${itinerary.start_date}\n`;
    content += `Travelers: ${itinerary.traveler_count}\n`;
    content += `Budget: ₹${itinerary.budget?.toLocaleString()}\n`;
    content += `Estimated Cost: ₹${itinerary.total_estimated_cost?.toLocaleString()}\n\n`;

    if (itinerary.user_comments) {
      content += `Preferences: ${itinerary.user_comments}\n\n`;
    }

    itinerary.days.forEach((day) => {
      content += `DAY ${day.day}\n`;
      content += `-------\n`;

      if (day.weather) {
        content += `Weather: ${day.weather.condition}, ${day.weather.min_temp_c}°C - ${day.weather.max_temp_c}°C\n\n`;
      }

      day.activities.forEach((activity, index) => {
        content += `${index + 1}. ${activity.name}\n`;
        content += `   ${activity.description}\n`;
        content += `   Duration: ${activity.duration_hours}h\n`;
        content += `   Cost: ₹${
          activity.estimated_cost?.toLocaleString() || "Free"
        }\n`;
        if (activity.best_time) {
          content += `   Best Time: ${activity.best_time}\n`;
        }
        content += `\n`;
      });
      content += `\n`;
    });

    return content;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
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
        return "🌃";
      case "heritage":
        return "🏰";
      default:
        return "📍";
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "sightseeing":
        return "bg-blue-50 border-blue-200";
      case "food":
        return "bg-orange-50 border-orange-200";
      case "adventure":
        return "bg-green-50 border-green-200";
      case "cultural":
        return "bg-purple-50 border-purple-200";
      case "shopping":
        return "bg-pink-50 border-pink-200";
      case "nature":
        return "bg-green-50 border-green-200";
      case "nightlife":
        return "bg-indigo-50 border-indigo-200";
      case "heritage":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "Free";
    return `₹${amount.toLocaleString()}`;
  };

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

  const renderBudgetWarning = () => {
    if (!itinerary?.budget_warning) return null;

    const { level, message, suggestions } = itinerary.budget_warning;

    const getWarningStyles = () => {
      switch (level) {
        case "critical":
          return {
            container: "bg-red-50 border-red-300",
            icon: "🚨",
            iconBg: "bg-red-100",
            titleColor: "text-red-800",
            messageColor: "text-red-700",
            suggestionBg: "bg-red-100",
            suggestionBorder: "border-red-200",
          };
        case "warning":
          return {
            container: "bg-yellow-50 border-yellow-300",
            icon: "⚠️",
            iconBg: "bg-yellow-100",
            titleColor: "text-yellow-800",
            messageColor: "text-yellow-700",
            suggestionBg: "bg-yellow-100",
            suggestionBorder: "border-yellow-200",
          };
        case "info":
          return {
            container: "bg-blue-50 border-blue-300",
            icon: "ℹ️",
            iconBg: "bg-blue-100",
            titleColor: "text-blue-800",
            messageColor: "text-blue-700",
            suggestionBg: "bg-blue-100",
            suggestionBorder: "border-blue-200",
          };
        default:
          return {
            container: "bg-gray-50 border-gray-300",
            icon: "💡",
            iconBg: "bg-gray-100",
            titleColor: "text-gray-800",
            messageColor: "text-gray-700",
            suggestionBg: "bg-gray-100",
            suggestionBorder: "border-gray-200",
          };
      }
    };

    const styles = getWarningStyles();

    return (
      <div
        className={`border-2 rounded-xl p-6 mb-6 ${styles.container} shadow-md`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`${styles.iconBg} rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0`}
          >
            <span className="text-2xl">{styles.icon}</span>
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-lg mb-2 ${styles.titleColor}`}>
              Budget{" "}
              {level === "critical"
                ? "Alert"
                : level === "warning"
                ? "Notice"
                : "Information"}
            </h4>
            <p className={`${styles.messageColor} mb-4 font-medium`}>
              {message}
            </p>
            {suggestions && suggestions.length > 0 && (
              <div>
                <h5
                  className={`font-semibold text-sm mb-2 ${styles.titleColor}`}
                >
                  💡 Suggestions:
                </h5>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className={`${styles.suggestionBg} ${styles.suggestionBorder} border rounded-lg p-3 text-sm ${styles.messageColor}`}
                    >
                      <span className="font-medium">•</span> {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderActivityCard = (activity: Activity, index: number) => (
    <div
      key={index}
      className="flex flex-col sm:flex-row rounded-2xl overflow-hidden border shadow-md mb-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
    >
      <div className="bg-gray-800 text-white p-4 sm:p-5 flex flex-col justify-between w-full sm:max-w-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex w-8 h-8 items-center justify-center bg-white text-black font-bold rounded-md text-sm sm:text-base">
              {index + 1}
            </div>
            <h5 className="font-bold text-base sm:text-lg line-clamp-1">
              {activity.name}
            </h5>
          </div>
          {activity.best_time && (
            <span className="text-white-800 flex items-center gap-1">
              <FontAwesomeIcon icon={faClock} />
              {activity.best_time}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white flex-1 p-4 sm:p-5 flex flex-col justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-center mb-3 sm:mb-4">
          <div>
            <div className="font-bold text-base sm:text-lg text-orange-500 flex items-center justify-center gap-1">
              {formatCurrency(activity.estimated_cost)}
            </div>
            <div className="text-xs text-gray-500">Cost</div>
          </div>

          {activity.duration_hours && (
            <div>
              <div className="font-bold text-base sm:text-lg text-gray-800 flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={faClock} />
                {Math.round(activity.duration_hours)}h
              </div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
          )}

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
    <div
      key={index}
      className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm hover:shadow-md transition-all"
    >
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
      <div className="flex gap-2">
        {hotel.place_id && (
          <button
            onClick={() =>
              window.open(
                `https://www.google.com/maps/place/?q=place_id:${hotel.place_id}`,
                "_blank"
              )
            }
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            View on Google Maps
          </button>
        )}
        {hotel.bookable !== false && (
          <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
            🎫 Bookable
          </span>
        )}
      </div>
    </div>
  );

  const renderCostBreakdown = () => {
    if (!itinerary) return null;

    const breakdown = itinerary.cost_breakdown || {
      accommodation: 0,
      activities: 0,
      transportation: 0,
      food: 0,
      miscellaneous: 0,
      total: itinerary.total_estimated_cost || 0,
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          💰 Cost Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">🏨 Accommodation</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(breakdown.accommodation)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">🎯 Activities</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(breakdown.activities)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">🍽️ Food & Dining</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(breakdown.food)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">🚗 Transportation</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(breakdown.transportation)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">📦 Miscellaneous</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(breakdown.miscellaneous)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-t-2 border-orange-200">
            <span className="text-lg font-bold text-gray-800">Total</span>
            <span className="text-lg font-bold text-orange-600">
              {formatCurrency(breakdown.total)}
            </span>
          </div>
        </div>
      </div>
    );
  };

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
            <div className="text-lg font-semibold text-blue-700">
              {route.distance}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Duration</div>
            <div className="text-lg font-semibold text-green-700">
              {route.duration}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Mode</div>
            <div className="text-lg font-semibold text-purple-700 capitalize">
              {route.travel_mode}
            </div>
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
    let count = 2;
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
    if (view === "hotels" && itinerary?.hotels && itinerary.hotels.length > 0)
      return `${position}%`;
    if (itinerary?.hotels && itinerary.hotels.length > 0) position += width;

    if (view === "route" && itinerary?.route_details) return `${position}%`;
    if (itinerary?.route_details) position += width;

    // if (view === "share") return `${position}%`;
    // position += width;

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
        <h1 className="text-gray-800 text-5xl font-bold">
          Plan your perfect journey with AI
        </h1>
      </div>

      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-2xl mb-8 border border-orange-100 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">
                From
              </label>
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
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition"
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">
                Duration (days)
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">
                Budget (INR)
              </label>
              <input
                type="number"
                min="1000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">
                Number of Travelers
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={travelerInput}
                onChange={(e) => setTravelerInput(e.target.value)}
                className="border rounded-xl px-3 py-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 placeholder-gray-500 transition"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">
                Preferred Transport
              </label>
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
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-gray-700">
                Theme(s) - Select one or more
              </label>
              <div className="relative" ref={dropdownRef}>
                <div
                  className="border rounded-xl px-3 py-3 w-full min-h-[48px] focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-400 text-gray-800 transition cursor-pointer bg-white flex flex-wrap items-center gap-2"
                  onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                >
                  {themes.length === 0 ? (
                    <span className="text-gray-500">Select themes...</span>
                  ) : (
                    themes.map((selectedTheme) => {
                      const themeOption = themeOptions.find(
                        (opt) => opt.value === selectedTheme
                      );
                      return (
                        <span
                          key={selectedTheme}
                          className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-orange-100 text-orange-800 border border-orange-200"
                        >
                          {themeOption?.label}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTheme(selectedTheme);
                            }}
                            disabled={loading}
                            className="ml-1 text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg leading-none"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                  <div className="ml-auto">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {themeOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                      >
                        <input
                          type="checkbox"
                          checked={themes.includes(option.value)}
                          onChange={() => handleThemeToggle(option.value)}
                          disabled={loading}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 flex-1">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 text-sm font-bold text-gray-700 block">
              Additional Preferences & Comments
            </label>
            <textarea
              placeholder="Tell us more about your preferences... e.g., 'I love historical sites and local street food', 'Avoid crowded places', 'Include kid-friendly activities', 'I'm interested in photography spots', etc"
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

      {itinerary && (
        <div className="mb-8 w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg relative overflow-hidden">
            <div
              className="absolute h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl transition-all duration-300 shadow-md"
              style={{
                width: getTabWidth(),
                left: getTabPosition(),
              }}
            />

            <div
              className={`grid w-full relative z-10`}
              style={{ gridTemplateColumns: `repeat(${getTabCount()}, 1fr)` }}
            >
              <button
                onClick={() => setView("list")}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all text-sm ${
                  view === "list"
                    ? "text-white"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                <span>Itinerary</span>
              </button>

              {itinerary.hotels && itinerary.hotels.length > 0 && (
                <button
                  onClick={() => setView("hotels")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all text-sm ${
                    view === "hotels"
                      ? "text-white"
                      : "text-gray-600 hover:text-orange-600"
                  }`}
                >
                  <span>Hotels ({itinerary.hotels.length})</span>
                </button>
              )}

              {itinerary.route_details && (
                <button
                  onClick={() => setView("route")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all text-sm ${
                    view === "route"
                      ? "text-white"
                      : "text-gray-600 hover:text-orange-600"
                  }`}
                >
                  <span>Route</span>
                </button>
              )}

              <button
                onClick={() => setView("map")}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all text-sm ${
                  view === "map"
                    ? "text-white"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !bookingConfirmed && (
        <div className="text-center p-6 bg-white shadow-lg rounded-2xl max-w-md">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-lg font-semibold text-gray-800">
            {showPaymentModal
              ? "Processing payment..."
              : "Generating your personalized itinerary..."}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {showPaymentModal
              ? "Please wait while we confirm your booking"
              : "Analyzing your preferences and comments..."}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 w-full max-w-4xl">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-xl">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {bookingConfirmed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 w-full max-w-4xl">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-green-700 mb-4">
              Your trip has been successfully booked. Confirmation details have
              been sent to your email.
            </p>
            <div className="bg-white rounded-lg p-4 text-left">
              <h4 className="font-semibold text-gray-800 mb-2">
                Booking Summary:
              </h4>
              <p className="text-sm text-gray-600">
                Total Amount:{" "}
                <span className="font-bold text-green-600">
                  {formatCurrency(getTotalBookingCost())}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Booking ID: <span className="font-mono">TRV-{Date.now()}</span>
              </p>
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span className="text-green-600 font-semibold">Confirmed</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {itinerary && !loading && (
        <div className="w-full max-w-6xl">
          {view === "list" ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-orange-600 text-white p-6">
                <h2 className="text-3xl font-bold mb-2">
                  Trip to {itinerary.to_location || itinerary.location}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="opacity-80">Duration:</span>{" "}
                    <strong>{itinerary.duration} days</strong>
                  </div>
                  <div>
                    <span className="opacity-80">Budget:</span>{" "}
                    <strong>{formatCurrency(itinerary.budget)}</strong>
                  </div>
                  <div>
                    <span className="opacity-80">Estimated Cost:</span>{" "}
                    <strong className="ml-1">
                      {formatCurrency(itinerary.total_estimated_cost)}
                    </strong>
                  </div>
                  <div>
                    <span className="opacity-80">Travelers:</span>{" "}
                    <strong>{itinerary.traveler_count || 1}</strong>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {itinerary.preferred_transport && (
                    <span className="capitalize bg-orange-500/70 px-3 py-1 rounded-full text-xs">
                      {getTransportIcon(itinerary.preferred_transport)}{" "}
                      {itinerary.preferred_transport}
                    </span>
                  )}
                  {itinerary.start_date && (
                    <span className="bg-orange-500/70 px-3 py-1 rounded-full text-xs">
                      {new Date(itinerary.start_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {itinerary.user_comments && (
                  <div className="mt-4 bg-orange-500/20 rounded-lg p-3">
                    <div className="text-sm font-medium mb-1">
                      Your Preferences:
                    </div>
                    <div className="text-sm opacity-90 italic">
                      "{itinerary.user_comments}"
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-b bg-gray-50">
                {renderBudgetWarning()}
              </div>

              <div className="p-6 border-b bg-gray-50">
                {renderCostBreakdown()}
              </div>

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

              <div className="p-6">
                {itinerary.days
                  .filter((day) => day.day === activeDay)
                  .map((day) => (
                    <div key={day.day}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          Day {day.day}
                          <span className="text-lg text-gray-500">
                            ({day.activities.length} activities)
                          </span>
                        </h3>
                        {day.total_day_cost && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              Day Total
                            </div>
                            <div className="text-xl font-bold text-orange-600">
                              {formatCurrency(day.total_day_cost)}
                            </div>
                          </div>
                        )}
                      </div>

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
                              <div className="text-sm text-gray-500">
                                {day.weather.date}
                              </div>
                              <div className="font-semibold text-gray-700">
                                {day.weather.condition}
                              </div>
                              <div className="text-sm text-gray-600">
                                {day.weather.min_temp_c}°C -{" "}
                                {day.weather.max_temp_c}°C
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-blue-700 font-medium">
                            Chance of Rain: {day.weather.chance_of_rain}%
                          </div>
                        </div>
                      )}

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

              <div className="border-t bg-gray-50 p-4 flex justify-between">
                <button
                  onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
                  disabled={activeDay === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ← Previous Day
                </button>
                <span className="text-sm text-gray-500 self-center">
                  Day {activeDay} of {itinerary.duration}
                </span>
                <button
                  onClick={() =>
                    setActiveDay(Math.min(itinerary.duration, activeDay + 1))
                  }
                  disabled={activeDay === itinerary.duration}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next Day →
                </button>
              </div>
            </div>
          ) : view === "hotels" ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Recommended Hotels
                </h3>
                <p className="text-gray-600">Hotels near your destination</p>
              </div>
              {itinerary.hotels && itinerary.hotels.length > 0 ? (
                <div className="grid gap-4">
                  {itinerary.hotels.map((hotel, index) =>
                    renderHotelCard(hotel, index)
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">🏨</div>
                  <p>No hotels found for this destination</p>
                  <p className="text-sm mt-1">
                    Try a different location or check back later
                  </p>
                </div>
              )}
            </div>
          ) : view === "route" ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Travel Route
                </h3>
                <p className="text-gray-600">
                  Route from {itinerary.from_location} to{" "}
                  {itinerary.to_location}
                </p>
              </div>
              {renderRouteDetails()}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-orange-600 text-white p-4">
                <h3 className="text-xl font-bold">Interactive Map View</h3>
                <p className="text-sm opacity-90">
                  Explore your itinerary locations
                </p>
              </div>
              <MapView itinerary={itinerary} activeDay={activeDay} />
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
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Confirm Booking
              </h3>
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Booking Summary
                  </h4>
                  {bookingItems
                    .filter((item) => item.selected && item.bookable)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm py-1"
                      >
                        <span className="text-gray-600">{item.name}</span>
                        <span className="text-gray-800">
                          {formatCurrency(item.cost)}
                        </span>
                      </div>
                    ))}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-orange-600">
                      {formatCurrency(getTotalBookingCost())}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Click "Proceed to Payment" to continue with booking
                    confirmation.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Payment Details
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePayment();
                }}
              >
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Order Summary
                    </h4>
                    <div className="text-sm space-y-1">
                      {bookingItems
                        .filter((item) => item.selected && item.bookable)
                        .map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-600">{item.name}</span>
                            <span className="text-gray-800">
                              {formatCurrency(item.cost)}
                            </span>
                          </div>
                        ))}
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                      <span className="text-gray-800">Total Amount:</span>
                      <span className="text-orange-600">
                        {formatCurrency(getTotalBookingCost())}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={paymentDetails.email}
                        onChange={(e) =>
                          setPaymentDetails((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={paymentDetails.phone}
                        onChange={(e) =>
                          setPaymentDetails((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="+91 12345 67890"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">
                      Payment Method
                    </h4>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="radio"
                          id="card"
                          name="payment"
                          defaultChecked
                          className="text-orange-600"
                        />
                        <label
                          htmlFor="card"
                          className="font-medium text-gray-800"
                        >
                          Credit/Debit Card
                        </label>
                        <div className="flex gap-1 ml-2">
                          <span className="text-xs bg-blue-100 px-1 py-0.5 rounded">
                            VISA
                          </span>
                          <span className="text-xs bg-red-100 px-1 py-0.5 rounded">
                            MC
                          </span>
                          <span className="text-xs bg-green-100 px-1 py-0.5 rounded">
                            AMEX
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentDetails.cardholderName}
                            onChange={(e) =>
                              setPaymentDetails((prev) => ({
                                ...prev,
                                cardholderName: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card Number
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={paymentDetails.cardNumber}
                            onChange={(e) => {
                              const value = e.target.value
                                .replace(/\s/g, "")
                                .replace(/(.{4})/g, "$1 ")
                                .trim();
                              setPaymentDetails((prev) => ({
                                ...prev,
                                cardNumber: value,
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Month
                            </label>
                            <select
                              required
                              value={paymentDetails.expiryMonth}
                              onChange={(e) =>
                                setPaymentDetails((prev) => ({
                                  ...prev,
                                  expiryMonth: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">MM</option>
                              {Array.from({ length: 12 }, (_, i) => (
                                <option
                                  key={i + 1}
                                  value={String(i + 1).padStart(2, "0")}
                                >
                                  {String(i + 1).padStart(2, "0")}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Year
                            </label>
                            <select
                              required
                              value={paymentDetails.expiryYear}
                              onChange={(e) =>
                                setPaymentDetails((prev) => ({
                                  ...prev,
                                  expiryYear: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">YY</option>
                              {Array.from({ length: 10 }, (_, i) => (
                                <option
                                  key={i}
                                  value={String(
                                    new Date().getFullYear() + i
                                  ).slice(-2)}
                                >
                                  {String(new Date().getFullYear() + i).slice(
                                    -2
                                  )}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CVV
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={4}
                              value={paymentDetails.cvv}
                              onChange={(e) =>
                                setPaymentDetails((prev) => ({
                                  ...prev,
                                  cvv: e.target.value.replace(/\D/g, ""),
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="123"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Share Your Itinerary
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shareable Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareableUrl}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(shareableUrl)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this link with friends and family to let them view
                    your itinerary
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Share via Social Media
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const text = `Check out my ${itinerary?.duration}-day trip to ${itinerary?.to_location}!`;
                        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          text
                        )}&url=${encodeURIComponent(shareableUrl)}`;
                        window.open(url, "_blank");
                      }}
                      className="px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 text-sm"
                    >
                      Twitter
                    </button>
                    <button
                      onClick={() => {
                        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          shareableUrl
                        )}`;
                        window.open(url, "_blank");
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Facebook
                    </button>
                    <button
                      onClick={() => {
                        const text = `Check out my trip plan: ${shareableUrl}`;
                        const url = `https://wa.me/?text=${encodeURIComponent(
                          text
                        )}`;
                        window.open(url, "_blank");
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
