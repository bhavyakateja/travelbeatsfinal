"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export interface Category {
  name: string;
  slug: string;
  description: string;
  image: string;
}

export const CATEGORIES: Category[] = [
  {
    name: "Luxury",
    slug: "Luxury",
    description: "5-star stays & bespoke service",
    image: "/category-carousel/luxury.jpg",
  },
  {
    name: "Romantic",
    slug: "Romantic",
    description: "Idyllic escapes for two",
    image: "/category-carousel/romantic.jpg",
  },
  {
    name: "Adventure",
    slug: "Adventure",
    description: "Thrills off the beaten track",
    image: "/category-carousel/adventure.jpg",
  },
  {
    name: "Beach",
    slug: "Beach",
    description: "Sun-drenched coastal horizons",
    image: "/category-carousel/beach.jpg",
  },
  {
    name: "Culture",
    slug: "Culture",
    description: "Rich heritage & local tradition",
    image: "/category-carousel/culture.jpg",
  },
  {
    name: "Family",
    slug: "Family",
    description: "Unforgettable shared experiences",
    image: "/category-carousel/family.jpg",
  },
  {
    name: "Nature",
    slug: "Nature",
    description: "Pristine wilderness & wildlife",
    image: "/category-carousel/nature.jpg",
  }
];

export function CategoryCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const [isClient, setIsClient] = useState(false);

  // Speed in px per second (matches DestinationCarousel)
  const speed = 40;

  // Duplicate items for seamless loop
  const items = [...CATEGORIES, ...CATEGORIES];

  useEffect(() => {
    setIsClient(true);
  }, []);

  const animate = useCallback(
    (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (!pausedRef.current && trackRef.current) {
        offsetRef.current += (speed * delta) / 1000;

        // Get width of one set of cards
        const track = trackRef.current;
        const singleSetWidth = track.scrollWidth / 2;

        // Reset when scrolled past one full set
        if (singleSetWidth > 0 && offsetRef.current >= singleSetWidth) {
          offsetRef.current -= singleSetWidth;
        }

        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }

      animRef.current = requestAnimationFrame(animate);
    },
    [speed]
  );

  useEffect(() => {
    if (!isClient) return;
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isClient, animate]);

  const handleMouseEnter = () => {
    pausedRef.current = true;
  };

  const handleMouseLeave = () => {
    pausedRef.current = false;
    lastTimeRef.current = 0;
  };

  return (
    <div
      className="destination-carousel-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="destination-carousel-track" ref={trackRef}>
        {items.map((cat, i) => (
          <Link
            key={`${cat.slug}-${i}`}
            href={`/destinations?tag=${encodeURIComponent(cat.slug)}`}
            className="destination-carousel-card group"
          >
            <div className="dcc-image-wrap">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
                className="dcc-image"
              />
              <div className="dcc-overlay" />
            </div>

            <div className="dcc-content">
              <span className="dcc-region">Category</span>
              <h3 className="dcc-name">{cat.name}</h3>
              <p className="dcc-tag">{cat.description}</p>
            </div>

            <span className="dcc-arrow">
              <ArrowRight size={18} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}