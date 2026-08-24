import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { SectionIntro, SiteFooter, SiteHeader } from "../components";
import { getPrisma } from "../lib/db";
import { JourneyModalWrapper } from "./journey-modal-wrapper";

export const dynamic = "force-dynamic";

interface ItineraryDay {
  day: string | number;
  title?: string;
  details?: string;
  description?: string;
}

export default async function JourneysPage() {
  // 1. Fetch published packages
  const packages = await getPrisma().package.findMany({
    where: {
      isPublished: true,
      archivedAt: null,
    },
    include: {
      destination: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      reviews: {
        where: { status: "APPROVED" },
        select: { rating: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 2. Group packages by Destination
  const destinationMap = new Map<
    string,
    {
      country: string;
      slug: string;
      images: string[];
      packages: Array<{
        id: string;
        title: string;
        duration: string;
        summary: string;
        schedule: { day: string; details: string }[];
        rating: string | null;
        reviewCount: number;
      }>;
    }
  >();

  packages.forEach((pkg) => {
    const countryName = pkg.destination?.name || "Featured Journeys";
    const countrySlug = pkg.destination?.slug || "general";

    if (!destinationMap.has(countrySlug)) {
      destinationMap.set(countrySlug, {
        country: countryName,
        slug: countrySlug,
        images: [],
        packages: [],
      });
    }

    const group = destinationMap.get(countrySlug)!;

    const coverImage = pkg.heroImageUrl || pkg.images[0] || "/placeholder-travel.jpg";
    if (coverImage && !group.images.includes(coverImage)) {
      group.images.push(coverImage);
    }

    const rawItinerary = Array.isArray(pkg.itinerary) ? (pkg.itinerary as unknown as ItineraryDay[]) : [];
    const schedule = rawItinerary.map((item, idx) => ({
      day: item.day ? `D${item.day}` : `D${idx + 1}`,
      details: item.title || item.details || item.description || "Sightseeing & exploration",
    }));

    const durationStr = `${pkg.durationNights}N/${pkg.durationDays}D`;

    const reviewCount = pkg.reviews.length;
    const averageRating =
      reviewCount > 0
        ? (
            pkg.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
          ).toFixed(1)
        : null;

    group.packages.push({
      id: pkg.id,
      title: pkg.title,
      duration: durationStr,
      summary: pkg.summary,
      schedule,
      rating: averageRating,
      reviewCount,
    });
  });

  const destinations = Array.from(destinationMap.values());

  return (
    <>
      <SiteHeader />
      <main className="bg-slate-50 min-h-screen">
        {/* Brand Hero */}
        <section className="relative bg-[#031838] pt-32 pb-20 md:pt-36 px-6 text-white overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A8E8]/10 via-[#031838] to-[#031838] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto text-center">
            <span className="inline-flex items-center text-xs uppercase font-bold tracking-widest text-[#00A8E8] bg-[#00A8E8]/10 px-3.5 py-1.5 rounded-full border border-[#00A8E8]/20 mb-6">
              Curated Journeys
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
              Routes Worth <span className="text-[#00A8E8]">Taking Slowly</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Explore our database of curated travel packages. Choose a destination to inspect daily itineraries and tailor your journey.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <SectionIntro
            eyebrow="Destinations"
            title="Browse Route Collections"
            text="Clean, structured itineraries pulled from our curated packages."
          />

          {/* Conditional Rendering for Empty State vs Grid */}
          {destinations.length === 0 ? (
            <div className="mt-10 p-12 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <p className="text-slate-500 text-sm md:text-base font-medium">
                No journeys yet. Check back soon!!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {destinations.map((group) => (
                <div
                  key={group.slug}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#00A8E8]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Card Cover */}
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                      <Image
                        src={group.images[0] || "/media/hero-journeys.png"}
                        alt={group.country}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#031838]/80 via-transparent to-transparent" />

                      <span className="absolute top-3 left-3 bg-[#031838]/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                        {group.country}
                      </span>

                      <span className="absolute bottom-3 right-3 bg-[#00A8E8] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                        {group.packages.length} Package{group.packages.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-[#031838] group-hover:text-[#00A8E8] transition-colors">
                        {group.country}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Explore featured route packages for {group.country}.
                      </p>

                      {/* Quick Package Previews */}
                      <div className="space-y-2">
                        {group.packages.slice(0, 3).map((pkg) => (
                          <div
                            key={pkg.id}
                            className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"
                          >
                            <span className="font-semibold text-[#031838] truncate pr-2">
                              {pkg.title}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#0077B6] bg-[#00A8E8]/10 px-2 py-0.5 rounded shrink-0">
                              {pkg.duration}
                            </span>
                          </div>
                        ))}
                        {group.packages.length > 3 && (
                          <p className="text-[11px] text-slate-400 text-center font-medium pt-1">
                            +{group.packages.length - 3} more options available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Modal Trigger Component */}
                  <div className="p-5 pt-0">
                    <JourneyModalWrapper group={group} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Route Banner */}
          <div className="mt-16 bg-[#031838] rounded-2xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-[#00A8E8] text-xs font-bold uppercase tracking-widest mb-2">
                <Sparkles size={14} />
                <span>Custom Tailored</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">
                Looking for a personalized route?
              </h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Our experts build fully customized itineraries tailored to your schedule, preferences, and group size.
              </p>
            </div>
            <Link
              href="/build-your-trip"
              className="relative z-10 inline-flex items-center gap-2 px-6 py-3 bg-[#00A8E8] hover:bg-[#0077B6] text-white font-bold rounded-xl text-xs transition-all shadow-md shrink-0"
            >
              <span>Build Your Trip</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}