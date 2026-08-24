import "server-only";

import { unstable_cache } from "next/cache";
import { fallbackDestinations, fallbackJournal, fallbackJourneys } from "./data";
import { getPrisma } from "./db";
import { JournalData } from "./data";

const CONTENT_TIMEOUT_MS = 1800;

// Safe wrapper that returns null instead of throwing an error on timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs = CONTENT_TIMEOUT_MS): Promise<T | null> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
    timer.unref?.();
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timer!);
  }
}

async function getPublishedDestinations() {
  return withTimeout(
    getPrisma().destination.findMany({
      where: { isPublished: true, archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })
  );
}

async function getPublishedDestinationBySlug(slug: string) {
  return withTimeout(
    getPrisma().destination.findFirst({
      where: { slug, isPublished: true, archivedAt: null },
    })
  );
}

async function getPublishedJourneys() {
  return withTimeout(
    getPrisma().package.findMany({
      where: { isPublished: true, archivedAt: null },
      orderBy: { title: "asc" },
      take: 12,
    })
  );
}

async function getPublishedJournal() {
  return withTimeout(
    getPrisma().blogPost.findMany({
      where: { isPublished: true, archivedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 12,
    })
  );
}

// 1. Cached fetch for all published destinations (guards against caching null/timeouts)
const fetchCachedDestinations = unstable_cache(
  async () => {
    const data = await getPublishedDestinations();
    // Return empty array or data, but keep track if it failed
    return data;
  },
  ["published-destinations-list"],
  {
    revalidate: 3600,
    tags: ["destinations"],
  }
);

// 2. Properly structured cached fetch for single destination
const fetchCachedDestinationBySlug = unstable_cache(
  async (slug: string) => {
    return await getPublishedDestinationBySlug(slug);
  },
  ["published-destination-by-slug"],
  {
    revalidate: 3600,
    tags: ["destinations"],
  }
);

export async function getDestinations(take?: number) {
  let rows = await fetchCachedDestinations();

  // If DB timed out or returned null, bypass cache once to try fetching directly
  if (rows === null) {
    rows = await getPublishedDestinations();
  }

  if (!rows || !rows.length) return [];

  // Slice the results if a limit/take parameter is provided
  if (take) {
    rows = rows.slice(0, take);
  }

  return rows.map((row) => {
    const images =
      row.images && row.images.length > 0
        ? row.images
        : row.heroImageUrl
          ? [row.heroImageUrl]
          : ["/media/journey-sky.jpg"];

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      region: row.region ?? row.country,
      country: row.country,
      tags: row.tags ?? [],
      summary: row.summary,
      description: row.description,
      image: images[0],
      images,
    };
  });
}

export async function getDestinationBySlug(slug: string) {
  let row = await fetchCachedDestinationBySlug(slug);

  if (row === null) {
    row = await getPublishedDestinationBySlug(slug);
  }

  if (row) {
    const images =
      row.images && row.images.length > 0
        ? row.images
        : row.heroImageUrl
          ? [row.heroImageUrl]
          : ["/media/journey-sky.jpg"];

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      region: row.region ?? row.country,
      country: row.country,
      tags: row.tags ?? [],
      summary: row.summary,
      description: row.description,
      image: images[0],
      images,
    };
  }

  return null;
}

export async function getJourneys() {
  const rows = await getPublishedJourneys();

  if (!rows || !rows.length) return fallbackJourneys;

  return rows.map((row) => {
    const images =
      row.images && row.images.length > 0
        ? row.images
        : row.heroImageUrl
          ? [row.heroImageUrl]
          : [`/journey/${row.slug}.jpg`];

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      images,
    };
  });
}

export async function getJournal(): Promise<JournalData[]> {
  const rows = await getPublishedJournal();

  if (!rows || !rows.length) return fallbackJournal;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.tags[0] ?? "Travel Note",
    readingMinutes: row.readingMinutes,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageUrl,
    coverImageAlt: row.coverImageAlt,
  }));
}