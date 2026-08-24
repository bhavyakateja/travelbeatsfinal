import type { MetadataRoute } from "next";
import { getDestinations } from "./lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const staticPaths = [
    "/",
    "/destinations",
    "/journeys",
    "/journal",
    "/build-your-trip",
    "/about",
    "/contact",
    "/auth/login",
    "/auth/signup",
  ];
  const destinations = await getDestinations();

  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
    })),
    ...destinations.map((destination) => ({
      url: `${base}/destinations/${destination.slug}`,
      lastModified: new Date(),
    })),
  ];
}
