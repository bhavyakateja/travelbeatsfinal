"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Quote, ChevronLeft, ChevronRight, SquarePen } from "lucide-react";

interface StaticReview {
  id: string;
  name: string;
  title: string;
  comment: string;
  rating: number;
  subtitle: string;
}

const STATIC_REVIEWS: StaticReview[] = [
  {
    id: "1",
    name: "Ananya Sharma",
    title: "A magical getaway in Kashmir",
    comment: "The team curated our Pahalgam itinerary seamlessly. Every driver was punctual, and the stays felt personal and luxurious.",
    rating: 5,
    subtitle: "Glimpse of Kashmir",
  },
  {
    id: "2",
    name: "Rohan & Priya Mehta",
    title: "Effortless planning for our honeymoon",
    comment: "We didn't have to worry about a single detail in Bali. From private villa transfers to quiet beach spots, everything hit the right beat.",
    rating: 5,
    subtitle: "Bali Private Escape",
  },
  {
    id: "3",
    name: "Vikram Sengupta",
    title: "Authentic and stress-free",
    comment: "Traveling through Rajasthan with kids can be intense, but the pacing suggested by The Travel Beats made it enjoyable for all of us.",
    rating: 5,
    subtitle: "Royal Rajasthan Circuit",
  },
  {
    id: "4",
    name: "Sneha Kapur",
    title: "Thoughtful recommendations",
    comment: "The local dining picks and hidden viewpoints in Vietnam made our trip stand out from standard tour packages.",
    rating: 5,
    subtitle: "Vietnam Explorer",
  },
  {
    id: "5",
    name: "Devansh Nair",
    title: "Impeccable execution",
    comment: "Quick support when our flight got delayed. They re-coordinated our pickup in minutes without any fuss.",
    rating: 5,
    subtitle: "Kerala Backwaters Voyage",
  },
  {
    id: "6",
    name: "Meera Krishnan",
    title: "Truly tailored to our speed",
    comment: "No rushed early morning buses or packed schedules. Just pure relaxation structured around what we wanted.",
    rating: 5,
    subtitle: "Swiss Alps & Lakes",
  },
];

export function ReviewCarousel() {
  const [currentIndex, setCurrentIndex] = useState(1);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? STATIC_REVIEWS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === STATIC_REVIEWS.length - 1 ? 0 : prev + 1));
  };

  const getVisibleReviews = () => {
    const total = STATIC_REVIEWS.length;
    const prevIdx = (currentIndex - 1 + total) % total;
    const nextIdx = (currentIndex + 1) % total;
    return [
      { item: STATIC_REVIEWS[prevIdx], position: "left" },
      { item: STATIC_REVIEWS[currentIndex], position: "center" },
      { item: STATIC_REVIEWS[nextIdx], position: "right" },
    ];
  };

  const visibleReviews = getVisibleReviews();

  return (
    <section className="reviews-section bg-white py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header with Actions on Right */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div className="max-w-xl">
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-[#00A8E8] mb-2 block">
              Traveler Stories
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#031838] tracking-tight leading-tight">
              Crafted with care, loved by travelers.
            </h2>
          </div>

          {/* Right Action Controls: Write Review + Navigation Arrows */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#00A8E8] hover:bg-[#0284c7] text-white text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <SquarePen size={15} />
              <span>Write a Review</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous Review"
                className="p-3 rounded-full border border-slate-200 text-[#031838] hover:bg-[#031838] hover:text-white transition-all duration-300 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next Review"
                className="p-3 rounded-full border border-slate-200 text-[#031838] hover:bg-[#031838] hover:text-white transition-all duration-300 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 3-Card Carousel Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center min-h-[360px]">
          {visibleReviews.map(({ item, position }) => {
            const isCenter = position === "center";

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between p-8 rounded-2xl transition-all duration-500 transform ${
                  isCenter
                    ? "bg-white border-2 border-[#00A8E8] shadow-2xl scale-105 z-10"
                    : "bg-slate-50 border border-slate-200/80 shadow-xs opacity-75 md:opacity-90 scale-95 z-0 hidden md:flex"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1 mb-4 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>

                  <Quote className="text-[#00A8E8]/30 mb-2" size={32} />

                  {item.title && (
                    <h3 className="font-bold text-[#031838] text-lg mb-2 leading-snug">
                      {item.title}
                    </h3>
                  )}

                  <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                    "{item.comment}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-[#031838] text-sm">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#00A8E8] font-medium">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}