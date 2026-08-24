import Link from "next/link";
import { ArrowRight, Heart, Sparkles, Compass } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components";
import { removeWishlistItem } from "../actions/wishlist";
import { getCurrentUser } from "../lib/auth";
import { getPrisma } from "../lib/db";
import { fallbackDestinations } from "../lib/data";

export const revalidate = 0;

async function getWishlistItems(userId: string) {
  try {
    return await getPrisma().wishlistItem.findMany({
      where: { userId },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            slug: true,
            region: true,
            heroImageUrl: true,
          },
        },
        package: {
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to load wishlist items:", error);
    return [];
  }
}

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="overflow-hidden bg-slate-50 min-h-screen">
          {/* Centered Logged Out Hero */}
          <section className="relative min-h-[480px] md:min-h-[520px] flex items-center justify-center text-center px-6 pt-36 pb-20 bg-[#031838] text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00A8E8]/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A8E8]/10 border border-[#00A8E8]/30 text-[#00A8E8] text-xs font-extrabold uppercase tracking-widest mb-6 backdrop-blur-md">
                <Heart size={13} className="text-[#00A8E8] fill-[#00A8E8]" /> Saved Collections
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Save what you <br />
                <em className="font-serif italic font-normal text-[#00A8E8]">want to revisit.</em>
              </h1>
              <p className="text-slate-300 text-base md:text-lg mb-8 max-w-md font-medium leading-relaxed">
                Sign in to keep your favorite destinations and custom journeys organized in one place.
              </p>
              <Link
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#00A8E8] hover:bg-[#0077B6] text-white font-bold text-sm transition-all shadow-lg shadow-[#00A8E8]/25 active:scale-95"
                href="/auth/login"
              >
                <span>Open profile</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const items = await getWishlistItems(user.id);

  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden bg-slate-50 min-h-screen flex flex-col justify-between">
        <div>
          {/* Centered Logged In Hero Section */}
          <section className="relative min-h-[380px] md:min-h-[440px] flex items-center justify-center text-center px-6 pt-36 pb-16 bg-[#031838] text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00A8E8]/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto w-full flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A8E8]/10 border border-[#00A8E8]/30 text-[#00A8E8] text-xs font-extrabold uppercase tracking-widest mb-4 backdrop-blur-md">
                <Sparkles size={13} className="text-[#00A8E8]" /> Personalized Ideas
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Your saved <br />
                <em className="font-serif italic font-normal text-[#00A8E8]">travel ideas.</em>
              </h1>
              <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed max-w-lg">
                Keep your dream destinations and curated routes here, then shape them into realities when you're ready.
              </p>
            </div>
          </section>

          {/* Main Content Area */}
          <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => {
                  const fallbackDest = fallbackDestinations.find(
                    (d) => d.id === item.destinationId
                  );

                  const destination = item.destination || fallbackDest;

                  const href = destination
                    ? `/destinations/${destination.slug}`
                    : item.package
                      ? `/build-your-trip?journey=${item.package.slug}`
                      : "/destinations";

                  const title =
                    destination?.name ||
                    item.package?.title ||
                    "Saved Item";

                  const label =
                    destination?.region ||
                    (item.itemType === "PACKAGE" ? "Journey" : "Destination");

                  const image =
                    (destination && "heroImageUrl" in destination && destination.heroImageUrl) ||
                    (destination && "image" in destination && destination.image) ||
                    "/placeholder-travel.jpg";

                  const activeItemId = item.destinationId || item.packageId || item.id;

                  return (
                    <article
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out"
                      key={item.id}
                    >
                      <Link href={href} className="relative w-full h-56 overflow-hidden bg-slate-900 block">
                        <img
                          src={image}
                          alt={title}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80" />
                      </Link>

                      <div className="p-6 flex flex-col flex-1 bg-white">
                        <span className="text-[11px] uppercase tracking-widest font-semibold text-[#0077B6] mb-2 block">
                          {label}
                        </span>

                        <h3 className="text-xl font-bold text-[#031838] mb-6 leading-snug group-hover:text-[#00A8E8] transition-colors">
                          <Link href={href}>{title}</Link>
                        </h3>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                          <Link
                            href={href}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#031838] hover:text-[#00A8E8] transition-colors"
                          >
                            Explore <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>

                          <form action={removeWishlistItem}>
                            <input
                              type="hidden"
                              name="itemId"
                              value={activeItemId}
                            />
                            <input
                              type="hidden"
                              name="itemType"
                              value={item.itemType}
                            />
                            <button
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-50"
                              type="submit"
                              aria-label={`Remove ${title} from wishlist`}
                            >
                              <Heart size={14} className="fill-rose-500 text-rose-500" /> Remove
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Empty State Box */
              <div className="max-w-lg mx-auto py-12 px-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center mb-6 shadow-inner">
                  <Compass size={32} />
                </div>
                <h2 className="text-2xl font-extrabold text-[#031838] mb-2">Your wishlist is empty</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm">
                  Explore our destinations or curated journeys and click the heart icon to save items for later.
                </p>
                <Link
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#00A8E8] hover:bg-[#0077B6] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#00A8E8]/20 active:scale-95 cursor-pointer"
                  href="/destinations"
                >
                  <span>Explore Destinations</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}