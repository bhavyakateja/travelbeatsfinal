"use client";

import { useMemo } from "react";
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
  // DepthCarousel already measures its own container with a
  // ResizeObserver and applies a CSS `scale()` transform to fit
  // (see updateScale/layout). Driving cardWidth/cardHeight from a
  // window "resize" listener here was redundant: it re-triggered
  // DepthCarousel's full relayout effect on every resize tick,
  // and it made <Image> refetch a different source size at each
  // breakpoint jump. A single base size + CSS scaling is smoother
  // and needs zero extra JS or network requests on resize.
  const carouselItems = useMemo(
    () =>
      destinations.map((destination) => ({
        image: destination.image,
        alt: `${destination.name}, ${destination.country}`,
        name: destination.name,
        country: destination.country,
      })),
    []
  );

  return (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
      <DepthCarousel
        items={carouselItems}
        cardWidth={480}
        cardHeight={580}
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