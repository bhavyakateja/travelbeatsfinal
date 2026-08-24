"use client";

import { useEffect, useState } from "react";
import DepthCarousel from "./depth-carousel";

const destinations = [
  { name: "Thailand", country: "Thailand", image: "/carousel/thailand.jpg" },
  { name: "Vietnam", country: "Vietnam", image: "/carousel/vietnam.jpg" },
  { name: "Dubai", country: "United Arab Emirates", image: "/carousel/dubai.jpg" },
  { name: "Paris", country: "France", image: "/carousel/paris.jpg" },
  { name: "Malaysia", country: "Malaysia", image: "/carousel/malaysia.jpg" },
  { name: "Australia", country: "Australia", image: "/carousel/australia.jpg" },
  { name: "Spain", country: "Spain", image: "/carousel/spain.jpg" },
  { name: "Rome", country: "Italy", image: "/carousel/rome.jpg" },
  { name: "Japan", country: "Japan", image: "/carousel/japan.jpg" },
];

export function HeroDestinationCarousel() {
  const [dimensions, setDimensions] = useState({ width: 480, height: 580 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        // Mobile dimensions
        setDimensions({ width: 280, height: 350 });
      } else if (window.innerWidth <= 1024) {
        // Tablet dimensions
        setDimensions({ width: 360, height: 440 });
      } else {
        // Desktop dimensions (Restored large size)
        setDimensions({ width: 480, height: 580 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const carouselItems = destinations.map((destination) => ({
    image: destination.image,
    alt: `${destination.name}, ${destination.country}`,
    name: destination.name,
    country: destination.country,
  }));

  return (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
      <DepthCarousel
        items={carouselItems}
        cardWidth={dimensions.width}
        cardHeight={dimensions.height}
        radius={24}
        depth={50}
        spread={22}
        tilt={0}
        tiltDirection="right"
        perspective={1100}
        visibleCards={2}
        falloff={0.25}
        blur={2}
        autoplay
        autoplayDelay={2500}
        loop
        duration={900}
        ease="power3.out"
        tint="#05060a"
        showControls={false}
        showIndicators={false}
        className="w-full h-full"
      />
    </div>
  );
}