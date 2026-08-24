import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Sparkles, Star, Tag } from "lucide-react";

import { SiteFooter, SiteHeader, TripRequestForm } from "../../components";
import { getCurrentUser } from "../../lib/auth";
import { getPrisma } from "../../lib/db";
import { SwipeableImageCarousel } from "../../swipeable-image-carousel";
import { WishlistButton } from "../../components"; // Adjust import path if needed

export const revalidate = 300;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatBestMonths(months: number[]): string {
  if (!months || months.length === 0) return "";
  return months
    .slice()
    .sort((a, b) => a - b)
    .map((m) => MONTH_NAMES[m - 1])
    .filter(Boolean)
    .join(", ");
}

export async function generateStaticParams() {
  const prisma = getPrisma();
  const destinations = await prisma.destination.findMany({
    where: { isPublished: true, archivedAt: null },
    select: { slug: true },
  });

  return destinations.map((d) => ({ slug: d.slug }));
}

export default async function DestinationDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prisma = getPrisma();

  const [destination, allDestinations, user] = await Promise.all([
    prisma.destination.findUnique({
      where: { slug },
      include: {
        packages: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.destination.findMany({
      where: { isPublished: true, archivedAt: null },
      select: { name: true },
    }),
    getCurrentUser(),
  ]);

  if (!destination || !destination.isPublished || destination.archivedAt) {
    notFound();
  }

  // Fetch whether user has this destination favorited (if logged in)
  let isWishlisted = false;
  if (user?.id) {
    const wishlistItem = await prisma.wishlistItem.findFirst({
      where: {
        userId: user.id,
        destinationId: destination.id,
      },
    });
    isWishlisted = !!wishlistItem;
  }

  const heroImage = destination.heroImageUrl || destination.images[0] || "/placeholder.jpg";
  const carouselImages = destination.images && destination.images.length > 0
    ? destination.images
    : [heroImage];

  const bestMonthsText = formatBestMonths(destination.bestMonths);
  const destinationsList = allDestinations.map((d) => d.name);

  const reviewsCount = destination.reviews.length;
  const averageRating = reviewsCount > 0
    ? (destination.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 pt-28 pb-16 md:px-8 md:pt-32">

        {/* Navigation & Place Name Header */}
        <div className="mb-8">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:text-slate-900 mb-3"
          >
            <ArrowLeft size={14} /> All Destinations
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">
            <MapPin size={14} />
            <span>
              {destination.region
                ? `${destination.region}, ${destination.country}`
                : destination.country}
            </span>
          </div>

          {/* Title Header Row with Wishlist Button on the Right */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              {destination.name}
            </h1>

            <div className="shrink-0">
              <WishlistButton
                itemId={destination.id}
                itemType="DESTINATION"
                defaultActive={isWishlisted}
                label={`Toggle wishlist for ${destination.name}`}
              />
            </div>
          </div>

          {destination.summary && (
            <p className="mt-2 max-w-3xl text-base text-slate-600 md:text-lg">
              {destination.summary}
            </p>
          )}

          {/* Tags Section */}
          {destination.tags && destination.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
                <Tag size={12} className="text-sky-600" /> Categories:
              </span>
              {destination.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/destinations?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-sky-400 hover:bg-sky-50/50 hover:text-sky-700"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* E-Commerce Product Image Section */}
        <section className="mb-12">
          <div className="grid gap-6 md:grid-cols-12 h-[380px] sm:h-[460px]">
            <div className="relative overflow-hidden rounded-3xl bg-slate-200 shadow-xs md:col-span-7 h-full">
              <Image
                src={heroImage}
                alt={destination.heroImageAlt || destination.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 58vw"
              />
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xs md:col-span-5 h-full">
              <SwipeableImageCarousel
                images={carouselImages}
                alt={`${destination.name} gallery`}
                sizes="(max-width: 768px) 100vw, 42vw"
              />
            </div>
          </div>
        </section>

        {/* Two-Column Details & Aligned Enquiry Form Section */}
        <section className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-6 space-y-6">

            {/* Description Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-600 block mb-2">
                A Place To Experience
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug mb-4">
                Start with {destination.name}.<br />
                <span className="font-serif italic font-normal text-slate-600">
                  Shape the rest with us.
                </span>
              </h2>

              <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed">
                <p className="whitespace-pre-line">
                  {destination.description || destination.summary || "Experience breathtaking landscapes, rich heritage, and authentic local travel tailored specifically for you."}
                </p>
              </div>
            </div>

            {/* Best Time to Visit Card */}
            {bestMonthsText && (
              <div className="rounded-3xl border border-sky-100 bg-sky-50/60 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2.5 font-bold text-sky-950 text-base sm:text-lg">
                  <Calendar className="h-5 w-5 text-sky-600" />
                  <h3>When to go</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {bestMonthsText}.
                </p>
              </div>
            )}

            {/* Journeys List Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                <Sparkles size={14} className="text-amber-500" />
                <span>Curated Itineraries</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Journeys in {destination.name}
              </h2>

              {destination.packages.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center border border-dashed border-slate-200">
                  <p className="text-sm font-medium text-slate-600">
                    No fixed itineraries available currently for {destination.name}.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Request a custom plan using the enquiry form to get started.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {destination.packages.map((pkg) => (
                    <Link
                      key={pkg.id}
                      href={`/journeys/${pkg.slug}`}
                      className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs transition hover:border-sky-300 hover:bg-white hover:shadow-md sm:flex-row sm:items-center"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-sky-600 text-base">
                          {pkg.title}
                        </h3>
                        {pkg.summary && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                            {pkg.summary}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Seamless Aligned Trip Form */}
          <aside className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
              <TripRequestForm
                initialDestination={destination.name}
                destinationsList={destinationsList}
              />
            </div>
          </aside>
        </section>

        {/* Customer Reviews Section */}
        <section className="mt-16 pt-12 border-t border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <span>Verified Feedback</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Traveler Reviews
              </h2>
            </div>

            {averageRating && (
              <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200/80 px-4 py-2.5 shadow-2xs">
                <span className="text-2xl font-extrabold text-slate-900">{averageRating}</span>
                <div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(Number(averageRating))
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Based on {reviewsCount} {reviewsCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {reviewsCount === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-600">
                No reviews left for {destination.name} yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {destination.reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {review.title && (
                      <h3 className="font-bold text-slate-900 text-base mb-2">{review.title}</h3>
                    )}
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                      {review.comment}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>{review.user?.fullName || "Verified Traveler"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}