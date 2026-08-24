"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type DestinationSlide = {
  name: string;
  slug: string;
  region: string;
  tag: string;
  image: string;
};

interface DestinationCarouselProps {
  destinations: DestinationSlide[];
}

export function DestinationCarousel({ destinations }: DestinationCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const [isClient, setIsClient] = useState(false);

  // Speed in px per second
  const speed = 40;

  // Duplicate items for seamless loop
  const items = [...destinations, ...destinations];

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

        // Reset when we've scrolled past one full set
        if (singleSetWidth > 0 && offsetRef.current >= singleSetWidth) {
          offsetRef.current -= singleSetWidth;
        }

        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }

      animRef.current = requestAnimationFrame(animate);
    },
    []
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
        {items.map((dest, i) => (
          <Link
            key={`${dest.slug}-${i}`}
            href={`/destinations/${dest.name}`}
            className="destination-carousel-card group"
          >
            <div className="dcc-image-wrap">
              <Image
                src={dest.image}
                alt={dest.name}
                fill
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
                className="dcc-image"
              />
              <div className="dcc-overlay" />
            </div>

            <div className="dcc-content">
              <span className="dcc-region">{dest.region}</span>
              <h3 className="dcc-name">{dest.name}</h3>
              <p className="dcc-tag">{dest.tag}</p>
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
