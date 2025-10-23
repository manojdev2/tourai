"use client";

import { useState } from "react";

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: "🎯",
      title: "Smart Itineraries",
      description:
        "AI-powered trip planning that adapts to your budget, interests, and available time in real-time",
    },
    {
      icon: "💰",
      title: "Transparent Pricing",
      description:
        "Get detailed cost breakdowns with no hidden fees. Know exactly what you're paying for",
    },
    {
      icon: "🌍",
      title: "Multi-Source Intelligence",
      description:
        "We aggregate data from maps, events, and local guides for the best recommendations",
    },
    {
      icon: "🎫",
      title: "One-Click Booking",
      description:
        "Book accommodations, transport, and experiences instantly through our EMT inventory",
    },
    {
      icon: "🌐",
      title: "Multilingual Support",
      description:
        "Plan your trip in your preferred language across all regions in India",
    },
    {
      icon: "⚡",
      title: "Real-Time Adjustments",
      description:
        "Smart adaptations for weather changes, delays, or last-minute bookings",
    },
  ];

  const themes = [
    { emoji: "🏛️", name: "Heritage" },
    { emoji: "🌃", name: "Nightlife" },
    { emoji: "🏔️", name: "Adventure" },
    { emoji: "🎭", name: "Cultural" },
    { emoji: "🍽️", name: "Food" },
    { emoji: "🌿", name: "Nature" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://ik.imagekit.io/yme0wx3ee/zeezo_eKJRqrJOD.png?updatedAt=1761204034098"
                alt="Zeezo.ai Logo"
                className="h-10"
              />
              {/* <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                zeezo.ai
              </span> */}
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                How It Works
              </a>
              <a
                href="#themes"
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                Themes
              </a>
              <button
                onClick={() => (window.location.href = "/planner")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Start Planning
              </button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3">
              <a
                href="#features"
                className="block text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                How It Works
              </a>
              <a
                href="#themes"
                className="block text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                Themes
              </a>
              <button
                onClick={() => (window.location.href = "/planner")}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-full font-semibold"
              >
                Start Planning
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-100 rounded-full opacity-20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold">
                  AI-Powered Travel Planning
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Plan Your Perfect Journey with
                <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  {" "}
                  AI
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                From dream to destination in minutes. Get personalized
                itineraries that adapt to your budget, interests, and time. Book
                everything with a single click.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => (window.location.href = "/planner")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  Start Planning Free
                </button>
                <button className="border-2 border-orange-500 text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 transition-all duration-200">
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600">Trips Planned</div>
                </div>
                <div className="w-px h-12 bg-gray-300" />
                <div>
                  <div className="text-3xl font-bold text-gray-900">4.9/5</div>
                  <div className="text-sm text-gray-600">User Rating</div>
                </div>
                <div className="w-px h-12 bg-gray-300" />
                <div>
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="font-bold text-xl text-gray-800">
                      Your Next Adventure
                    </h3>
                    <span className="text-2xl">🗺️</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📍</span>
                        <div>
                          <div className="font-semibold text-gray-800">
                            Destination
                          </div>
                          <div className="text-sm text-gray-600">
                            Jaipur, Rajasthan
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="font-bold text-gray-800">5 Days</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="text-sm text-gray-600">Budget</div>
                        <div className="font-bold text-gray-800">₹25,000</div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span>🎭</span>
                        <span className="font-semibold text-gray-800">
                          Theme: Heritage & Culture
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Personalized itinerary generated
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                    View Full Itinerary
                  </button>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">
                      Instant Booking
                    </div>
                    <div className="text-sm text-gray-600">
                      One-click checkout
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Zeezo.ai?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of travel planning with AI-powered
              intelligence and seamless booking
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20 bg-gradient-to-br from-orange-50 to-white"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Your perfect trip in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Tell Us Your Preferences
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Share your destination, budget, duration, and interests. Our
                  AI understands your unique travel style.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <svg
                  className="w-8 h-8 text-orange-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Get Your AI Itinerary
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Receive a personalized day-by-day plan with activities,
                  accommodations, and transport options tailored to you.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <svg
                  className="w-8 h-8 text-orange-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Book & Go!
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Review your itinerary and book everything with one click. Get
                  instant confirmations and enjoy your trip!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Themes Section */}
      <section id="themes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explore By Theme
            </h2>
            <p className="text-xl text-gray-600">
              Choose your travel style and let AI craft the perfect experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {themes.map((theme, index) => (
              <button
                key={index}
                className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100 rounded-2xl p-6 hover:border-orange-500 hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <div className="text-4xl mb-2">{theme.emoji}</div>
                <div className="font-semibold text-gray-800">{theme.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of travelers who trust Zeezo.ai for their perfect
            trips
          </p>
          <button
            onClick={() => (window.location.href = "/planner")}
            className="bg-white text-orange-600 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
          >
            Plan Your Trip Now - It&apos;s Free
          </button>
          <p className="text-orange-100 mt-4 text-sm">
            • Instant itinerary generation
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="https://ik.imagekit.io/yme0wx3ee/Alto.%20(1)_RxZxFhFm7.png?updatedAt=1758194824112"
                  alt="Zeezo.ai"
                  className="h-8"
                />
                <span className="text-xl font-bold">zeezo.</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered travel planning for the modern explorer
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#themes"
                    className="hover:text-white transition-colors"
                  >
                    Travel Themes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div> */}

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>
              © 2025 Zeezo.ai By Krossark, All rights reserved, Built with AI
              for travelers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
