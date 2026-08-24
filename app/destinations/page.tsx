import Image from "next/image";
import Link from "next/link";
import {
  DestinationCard,
  SectionIntro,
  SiteFooter,
  SiteHeader,
} from "../components";
import { getCurrentUser } from "../lib/auth";
import { getDestinations } from "../lib/content";
import { getPrisma } from "../lib/db";

export const dynamic = "force-dynamic";

export default async function Destinations({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [params, destinations, user] = await Promise.all([
    searchParams,
    getDestinations(),
    getCurrentUser(),
  ]);

  const selectedCategory = params.category?.trim() || "";

  /*
   * Get all unique categories from Destination.tags
   */
  const categories = Array.from(
    new Set(
      destinations
        .flatMap((destination) => destination.tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ).sort();

  /*
   * Filter destinations when a category is selected.
   */
  const filteredDestinations = selectedCategory
    ? destinations.filter((destination) =>
        destination.tags?.some(
          (tag) =>
            tag.trim().toLowerCase() === selectedCategory.toLowerCase()
        )
      )
    : destinations;

  const wishlistedDestinations = user
    ? await getPrisma().wishlistItem.findMany({
        where: {
          userId: user.id,
          destinationId: { not: null },
        },
        select: {
          destinationId: true,
        },
      })
    : [];

  const wishlistedDestinationIds = new Set(
    wishlistedDestinations
      .map((item) => item.destinationId)
      .filter(Boolean) as string[]
  );

  return (
    <>
      <SiteHeader />

      <main className="bg-slate-50/60 min-h-screen">
        {/* HERO */}
        <section className="relative min-h-[600px] md:min-h-[750px] flex items-center justify-center px-6 py-24 text-white overflow-hidden">
          <Image
            src="/media/hero-dest-page.png"
            alt="Luxury Travel Destinations"
            fill
            priority
            className="object-cover object-center z-0 scale-105 transition-transform duration-1000"
            sizes="100vw"
          />

          {/* Gradient Overlay tuned for brand blues and high contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/20 z-1" />

          <div className="relative z-2 max-w-7xl mx-auto w-full">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-sky-400 mb-4 bg-sky-950/50 backdrop-blur-md px-3 py-1 rounded-full border border-sky-500/30">
                Explore the world
              </span>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.15] tracking-tight text-white mb-6 drop-shadow-md">
                Where does your story take you?
                <br />
                <em className="font-serif italic text-sky-200 font-normal">
                  Journeys thoughtfully shaped around you.
                </em>
              </h1>

              <p className="text-slate-200 text-base md:text-lg leading-relaxed font-normal max-w-xl drop-shadow-sm">
                Whether you’re seeking new adventures, travelling with
                the people you love, or simply getting away, there is a
                journey waiting for you.
              </p>
            </div>
          </div>
        </section>

        {/* DESTINATIONS SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <SectionIntro
            eyebrow="A considered collection"
            title="Start with a place. End with a memory."
          />

          {/* CATEGORY FILTERS */}
          <div className="mt-10 flex flex-wrap items-center gap-2.5">
            {/* ALL BUTTON */}
            <Link
              href="/destinations"
              scroll={false}
              className={`
                rounded-full
                px-6
                py-2.5
                text-sm
                font-semibold
                transition-all
                duration-200
                cursor-pointer
                ${
                  !selectedCategory
                    ? "bg-sky-600 !text-white shadow-md ring-2 ring-sky-600/20"
                    : "bg-white !text-slate-700 border border-slate-200 hover:border-sky-500 hover:!text-sky-600 hover:shadow-xs"
                }
              `}
            >
              All
            </Link>

            {/* CATEGORY BUTTONS */}
            {categories.map((category) => {
              const isActive =
                selectedCategory.toLowerCase() === category.toLowerCase();

              return (
                <Link
                  key={category}
                  href={`/destinations?category=${encodeURIComponent(category)}`}
                  scroll={false}
                  className={`
                    rounded-full
                    px-6
                    py-2.5
                    text-sm
                    font-semibold
                    transition-all
                    duration-200
                    cursor-pointer
                    ${
                      isActive
                        ? "bg-sky-600 !text-white shadow-md ring-2 ring-sky-600/20"
                        : "bg-white !text-slate-700 border border-slate-200 hover:border-sky-500 hover:!text-sky-600 hover:shadow-xs"
                    }
                  `}
                >
                  {category}
                </Link>
              );
            })}
          </div>

          {/* RESULT COUNT */}
          <div className="mt-8 mb-6 flex items-center justify-between border-b border-slate-200/80 pb-4">
            <p className="text-sm font-medium text-slate-500">
              {selectedCategory ? (
                <>
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedCategory}
                  </span>{" "}
                  destinations
                </>
              ) : (
                "Explore all destinations"
              )}
            </p>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200/60">
              {filteredDestinations.length}{" "}
              {filteredDestinations.length === 1
                ? "destination"
                : "destinations"}
            </span>
          </div>

          {/* DESTINATION CARDS / NO RESULTS */}
          {filteredDestinations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDestinations.map((destination, index) => (
                <DestinationCard
                  destination={destination}
                  index={index}
                  key={destination.id}
                  wishlisted={wishlistedDestinationIds.has(destination.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs px-6">
              <h3 className="text-xl font-bold text-slate-900">
                No destinations found
              </h3>

              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                We don&apos;t currently have destinations listed under this category.
              </p>

              <Link
                href="/destinations"
                className="inline-flex mt-6 rounded-full bg-sky-600 hover:bg-sky-700 px-6 py-3 text-sm font-semibold !text-white shadow-md transition-all active:scale-95"
              >
                View all destinations
              </Link>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}