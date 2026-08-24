import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Star, Quote } from "lucide-react";
import {
  SectionIntro,
  SiteFooter,
  SiteHeader,
  WishlistButton,
} from "./components";
import { getCurrentUser } from "./lib/auth";
import { getJourneys } from "./lib/content";
import { getPrisma } from "./lib/db";
import { HeroDestinationCarousel } from "./hero-destination-carousel";
import { BuildTripCarouselButton } from "./BuildTripCarouselButton";
import { DestinationCarousel, type DestinationSlide } from "./destination-carousel";
import { CategoryCarousel } from "./category-carousel";
import { ReviewCarousel } from "./review-carousel"

const hardcodedDestinations: DestinationSlide[] = [
  {
    name: "Vietnam",
    slug: "vietnam",
    region: "Southeast Asia",
    tag: "Lantern-lit streets · Emerald bays",
    image: "/carousel/vietnam.jpg",
  },
  {
    name: "Thailand",
    slug: "thailand",
    region: "Southeast Asia",
    tag: "Temple dawns · Island sunsets",
    image: "/carousel/thailand.jpg",
  },
  {
    name: "Australia",
    slug: "australia",
    region: "Oceania",
    tag: "Coastal roads · Outback skies",
    image: "/carousel/australia.jpg",
  },
  {
    name: "Paris",
    slug: "paris",
    region: "Western Europe",
    tag: "Café mornings · Golden light",
    image: "/carousel/paris.jpg",
  },
  {
    name: "Dubai",
    slug: "dubai",
    region: "Middle East",
    tag: "Desert luxury · City skyline",
    image: "/carousel/dubai.jpg",
  },
  {
    name: "Japan",
    slug: "japan",
    region: "East Asia",
    tag: "Quiet rituals · Modern rhythm",
    image: "/carousel/japan.jpg",
  },
];

// Featured Country Journeys Data
const featuredJourneys = [
  {
    id: "vietnam-curated",
    slug: "vietnam",
    title: "Vietnam Essentials & Grand Routes",
    duration: "3N/4D to 8N/9D",
    summary: "From Ho Chi Minh City & Cu Chi Tunnels to Hanoi, Halong Bay cruises, Hoi An, and Ba Na Hills.",
    optionsCount: "6 Route Options",
  },
  {
    id: "usa-curated",
    slug: "usa",
    title: "USA Highlights & Coast-to-Coast",
    duration: "4N/5D to 10N/11D",
    summary: "New York, Washington DC, Niagara Falls, Orlando theme parks, Miami beaches, and Las Vegas & LA.",
    optionsCount: "7 Route Options",
  },
  {
    id: "dubai-curated",
    slug: "dubai",
    title: "Dubai & Abu Dhabi Discovery",
    duration: "5N/6D to 8N/9D",
    summary: "Burj Khalifa, Desert Safaris, Abu Dhabi Grand Mosque, Museum of the Future & Marina Cruises.",
    optionsCount: "4 Route Options",
  },
  {
    id: "greece-curated",
    slug: "greece",
    title: "Greece Aegean Odyssey",
    duration: "5N/6D to 10N/11D",
    summary: "Historic Athens, iconic sunsets in Santorini, vibrant Mykonos, and ancient ruins in Crete.",
    optionsCount: "6 Route Options",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const [dbJourneys, user, reviews] = await Promise.all([
    getJourneys(),
    getCurrentUser(),
    getPrisma().review.findMany({
      where: {
        status: "APPROVED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            fullName: true,
          },
        },
        destination: {
          select: {
            name: true,
          },
        },
        package: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  const wishlistedItems = user
    ? await getPrisma().wishlistItem.findMany({
      where: { userId: user.id },
      select: { destinationId: true, packageId: true },
    })
    : [];

  const wishlistedPackageIds = new Set(
    wishlistedItems.map((item) => item.packageId).filter(Boolean) as string[],
  );

  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden">
        {/* 1. HERO SECTION */}
        <section className="hero">
          <div className="hero-backdrop" />
          <div className="hero-route hero-route-one" />
          <div className="hero-route hero-route-two" />

          <div className="hero-content">
            <div className="hero-kicker">
              <span /> CURATING SEAMLESS JOURNEYS
            </div>
            <h1>
              Somewhere out there,
              <br />
              <em>your next story is waiting.</em>
            </h1>
            <p>
              Personalised holidays, thoughtfully planned around your time, budget, interests and travel style.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary transition-transform duration-300 hover:scale-105 active:scale-95" href="/destinations">
                Explore destinations <ArrowRight size={17} />
              </Link>
              <Link className="button button-ghost transition-transform duration-300 hover:scale-105 active:scale-95" href="/build-your-trip">
                Build your trip
              </Link>
            </div>
          </div>

          <div className="hero-media">
            <HeroDestinationCarousel />
          </div>

          <div className="hero-scroll">
            Scroll to explore <span />
          </div>
        </section>

        {/* 2. CATEGORIES SECTION */}
        <section className="categories-section section-pad bg-white">
          <div className="section-heading-row">
            <SectionIntro
              eyebrow="Browse by style"
              title="Find your kind of journey."
              text="Filter destinations tailored directly to your preferred way of traveling."
            />
            <Link className="text-link group" href="/destinations">
              Explore all categories{" "}
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <CategoryCarousel />
        </section>

        {/* 3. JOURNEYS SECTION */}
        <section className="journeys-preview section-pad bg-white border-t border-slate-100">
          <div className="section-heading-row">
            <SectionIntro
              eyebrow="Curated journeys"
              title="A route to start from."
              text="Use a considered itinerary as inspiration, then make it yours."
            />
            <Link className="text-link group" href="/journeys">
              Browse journeys <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Clean Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredJourneys.map((journey, index) => (
              <article className="journey-preview-card-wrap relative flex flex-col justify-between p-6 rounded-2xl bg-slate-50 border border-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300" key={journey.id}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400">0{index + 1}</span>
                    <WishlistButton
                      itemId={journey.id}
                      itemType="PACKAGE"
                      defaultActive={wishlistedPackageIds.has(journey.id)}
                      label={`Toggle wishlist for ${journey.title}`}
                    />
                  </div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#00A8E8] bg-[#00A8E8]/10 px-2 py-0.5 rounded mb-2">
                    {journey.duration}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug">
                    {journey.title}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-4">
                    {journey.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">{journey.optionsCount}</span>
                  <Link href={`/journeys#${journey.slug}`} className="inline-flex items-center justify-center text-slate-900 hover:text-amber-600 transition-colors">
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 4. DESTINATIONS SECTION */}
        <section className="destinations-section section-pad bg-slate-50/50">
          <div className="section-heading-row">
            <SectionIntro
              eyebrow="Where next"
              title="Places with a pulse."
              text="Start with a feeling. We'll help you find the place that matches it."
            />
            <Link className="text-link group" href="/destinations">
              View all destinations <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <DestinationCarousel destinations={hardcodedDestinations} />
        </section>

        {/* 5. BUILD YOUR OWN TRIP SECTION */}
        <section className="section-pad bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <span className="text-xs uppercase tracking-widest text-sky-700 font-semibold block mb-2">
                  Tailored Travel
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  Build your trip with us in just 4 easy steps.
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="text-sky-600 font-mono text-sm font-bold pt-1">01</span>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">Step 1 — Tell us what you’re looking for</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Destination, dates, budget, interests. Tell us how you want your trip to feel.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-sky-600 font-mono text-sm font-bold pt-1">02</span>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">Step 2 — We build your itinerary</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Our travel experts create an itinerary around your preferences, pace and priorities.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-sky-600 font-mono text-sm font-bold pt-1">03</span>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">Step 3 — Make it yours</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Want more time to explore? Have something specific in mind? We’ll tailor the itinerary with you.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-sky-600 font-mono text-sm font-bold pt-1">04</span>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">Step 4 — Pack your bags</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Everything is taken care of. Now all that’s left is to pack your bags and get ready for a story worth telling.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <BuildTripCarouselButton />
            </div>
          </div>
        </section>


        {/* 6. REVIEWS SECTION */}
        <section>
          <div>
            <ReviewCarousel />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}