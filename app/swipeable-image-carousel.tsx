"use client";

import { useState, useRef, TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwipeableImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  aspectRatioClass?: string;
  sizes?: string;
  priority?: boolean;
  showBadge?: boolean;
  badgePosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function SwipeableImageCarousel({
  images,
  alt,
  className = "object-cover object-center w-full h-full transition-transform duration-700 ease-out group-hover:scale-105",
  aspectRatioClass = "absolute inset-0 w-full h-full",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  showBadge = true,
  badgePosition = "top-left",
}: SwipeableImageCarouselProps) {
  const validImages =
    Array.isArray(images) && images.length > 0
      ? images
      : ["/media/journey-sky.jpg"];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch and drag swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const getBadgePositionClass = () => {
    switch (badgePosition) {
      case "top-right":
        return "top-4 right-16";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "top-left":
      default:
        return "top-4 left-4";
    }
  };

  // If only 1 image, render standard static Image component
  if (validImages.length <= 1) {
    return (
      <div className={`overflow-hidden ${aspectRatioClass}`}>
        <Image
          src={validImages[0]}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={className}
        />
      </div>
    );
  }

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex(index);
  };

  // Touch Handlers for Mobile Swipe
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    if (
      touchStartX.current &&
      Math.abs(touchStartX.current - e.targetTouches[0].clientX) > 10
    ) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div
      className={`group/carousel overflow-hidden ${aspectRatioClass}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (isSwiping.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* Slides Container */}
      <div className="absolute inset-0 h-full w-full">
        {validImages.map((src, index) => (
          <div
            key={index}
            className={`absolute inset-0 h-full w-full transition-opacity duration-500 ease-in-out ${
              index === currentIndex
                ? "opacity-100 z-1"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <Image
              src={src}
              alt={`${alt} - Image ${index + 1}`}
              fill
              priority={priority && index === 0}
              sizes={sizes}
              className={className}
            />
          </div>
        ))}
      </div>

      {/* Counter Badge */}
      {showBadge && (
        <div
          className={`absolute ${getBadgePositionClass()} z-20 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-mono font-semibold tracking-widest text-white backdrop-blur-md border border-white/20 shadow-md`}
        >
          {currentIndex + 1} / {validImages.length}
        </div>
      )}

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute top-1/2 left-3 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/65 text-white backdrop-blur-md border border-white/20 transition hover:bg-slate-950/90 hover:scale-110 active:scale-95 opacity-90 sm:opacity-0 group-hover/carousel:opacity-100 shadow-lg"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="absolute top-1/2 right-3 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/65 text-white backdrop-blur-md border border-white/20 transition hover:bg-slate-950/90 hover:scale-110 active:scale-95 opacity-90 sm:opacity-0 group-hover/carousel:opacity-100 shadow-lg"
        aria-label="Next image"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Pagination Indicators (Dots) */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-950/60 px-3 py-1.5 backdrop-blur-md border border-white/20 shadow-md">
        {validImages.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => goToSlide(index, e)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-4 bg-amber-400"
                : "w-1.5 bg-white/40 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
