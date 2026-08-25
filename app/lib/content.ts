import "server-only";

import { unstable_cache } from "next/cache";
import { fallbackJournal, fallbackJourneys } from "./data";
import { getPrisma } from "./db";
import { JournalData } from "./data";

const CONTENT_TIMEOUT_MS = 4000;

// Safe wrapper that returns null instead of throwing an error on timeout.
// IMPORTANT: this is only safe to use OUTSIDE unstable_cache. If a function
// wrapped in unstable_cache resolves to null, Next.js will happily cache
// that null for the full `revalidate` window — poisoning the cache with a
// "no data" result until it expires. Anything passed to unstable_cache must
// throw on failure instead of returning null, so a failed attempt is never
// stored, and the very next request gets a clean retry.
async function withTimeout<T>(promise: Promise<T>, timeoutMs = CONTENT_TIMEOUT_MS): Promise<T | null> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
    timer.unref?.();
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error("[content] DB query failed:", error);
    return null;
  } finally {
    clearTimeout(timer!);
  }
}

// Throws instead of returning null so this is safe to hand directly to
// unstable_cache — a timeout/error becomes a rejected promise, which
// Next.js does NOT cache, rather than a `null` value, which it does.
async function withTimeoutOrThrow<T>(promise: Promise<T>, timeoutMs = CONTENT_TIMEOUT_MS): Promise<T> {
  const result = await withTimeout(promise, timeoutMs);
  if (result === null) {
    throw new Error("Content query timed out or failed");
  }
  return result;
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

// 1. Cached fetch for all published destinations. Throws (never returns
// null) so a cold-start timeout can't get written into the cache.
const fetchCachedDestinations = unstable_cache(
  async () => {
    return withTimeoutOrThrow(
      getPrisma().destination.findMany({
        where: { isPublished: true, archivedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      })
    );
  },
  ["published-destinations-list"],
  {
    revalidate: 3600,
    tags: ["destinations"],
  }
);

// 2. Cached fetch for a single destination — same throw-not-null contract.
const fetchCachedDestinationBySlug = unstable_cache(
  async (slug: string) => {
    return withTimeoutOrThrow(
      getPrisma().destination.findFirst({
        where: { slug, isPublished: true, archivedAt: null },
      })
    );
  },
  ["published-destination-by-slug"],
  {
    revalidate: 3600,
    tags: ["destinations"],
  }
);

export async function getDestinations(take?: number) {
  let rows;

  try {
    rows = await fetchCachedDestinations();
  } catch {
    // Cache attempt failed (cold connection, DB blip, etc). Fall back to a
    // direct, still-timeout-guarded query for THIS request only — nothing
    // here touches the cache, so the next request gets a clean shot at
    // populating it properly instead of inheriting a poisoned null.
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
  let row;

  try {
    row = await fetchCachedDestinationBySlug(slug);
  } catch {
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