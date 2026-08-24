"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const CAROUSEL_IMAGES = [
  "/build-button/1.jpg",
  "/build-button/2.jpg",
  "/build-button/3.jpg",
  "/build-button/4.jpg",
  "/build-button/5.jpg",
];

export function BuildTripCarouselButton() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % CAROUSEL_IMAGES.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  return (
    <Link
      href="/build-your-trip"
      className="group relative block w-full h-[400px] lg:h-[500px] overflow-hidden rounded-3xl border border-slate-200/20 shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
    >
      {/* Background Image Carousel */}
      {CAROUSEL_IMAGES.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
            } transition-transform duration-[4000ms]`}
        >
          <Image
            src={src}
            alt="Build your custom trip"
            fill
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent transition-opacity group-hover:opacity-90" />

      {/* Call To Action Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-white">
        <span className="text-xs uppercase tracking-widest text-sky-300 font-semibold mb-2">
          Custom Itinerary Builder
        </span>
        <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
          Start Building Your Trip
        </h3>
        <div className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-full text-sm transition-all duration-300 group-hover:bg-sky-500 group-hover:text-white group-hover:gap-3">
          Build Your Own Package
          <ArrowRight size={18} />
        </div>
      </div>
    </Link>
  );
}