import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Star, MessageSquarePlus, CheckCircle2 } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/app/components";
import { getPrisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

async function submitCustomerReview(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const userId = String(formData.get("userId") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  const title = String(formData.get("title") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim();
  const destinationId = String(formData.get("destinationId") ?? "").trim() || null;
  const packageId = String(formData.get("packageId") ?? "").trim() || null;

  if (!userId || !comment || isNaN(rating)) {
    redirect("/reviews?error=missing-fields");
  }

  try {
    await prisma.review.create({
      data: {
        userId,
        rating,
        title,
        comment,
        status: "PENDING",
        destinationId,
        packageId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/reviews?error=db-error");
  }

  revalidatePath("/reviews");
  redirect("/reviews?submitted=true");
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const prisma = getPrisma();
  const params = await searchParams;

  const reviews = await prisma.review.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      user: {
        select: { fullName: true },
      },
      destination: {
        select: { name: true },
      },
      package: {
        select: { title: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });

  const destinations = await prisma.destination.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
  });

  const packages = await prisma.package.findMany({
    where: { isPublished: true, archivedAt: null },
    select: { id: true, title: true },
  });

  return (
    <>
      <SiteHeader />
      <main className="w-full bg-slate-50 min-h-screen pb-20">
        {/* HERO SECTION */}
        <section className="relative min-h-[380px] flex items-center justify-center px-6 pt-32 pb-16 text-white overflow-hidden bg-[#031838]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A8E8]/20 via-[#031838] to-[#031838]" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-block text-xs uppercase tracking-widest font-extrabold text-[#00A8E8] bg-[#00A8E8]/10 px-3.5 py-1.5 rounded-full border border-[#00A8E8]/20 mb-4">
              Community Voices
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Stories & Feedback from our travelers.
            </h1>
            <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Share your journey or read authentic experiences curated across the globe.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20 space-y-16">
          {/* SUCCESS NOTIFICATION */}
          {params.submitted && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 shadow-md">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Thank you for sharing your experience!</p>
                <p className="text-xs text-emerald-700">
                  Your review has been submitted and sent to our team for approval.
                </p>
              </div>
            </div>
          )}

          {/* 1. WRITE A REVIEW FORM (PLACED FIRST) */}
          <section className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl">
            <div className="flex items-center gap-2 text-[#00A8E8] font-bold text-xs uppercase tracking-widest mb-2">
              <MessageSquarePlus size={18} />
              <span>Share Experience</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#031838] mb-8">
              Write a Review
            </h2>

            <form action={submitCustomerReview} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Your Profile *
                  </label>
                  <select
                    name="userId"
                    required
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-none focus:border-[#00A8E8] focus:bg-white transition-all"
                  >
                    <option value="">-- Choose User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Rating *
                  </label>
                  <select
                    name="rating"
                    defaultValue="5"
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-none focus:border-[#00A8E8] focus:bg-white transition-all"
                  >
                    <option value="5">5 Stars - Exceptional</option>
                    <option value="4">4 Stars - Very Good</option>
                    <option value="3">3 Stars - Average</option>
                    <option value="2">2 Stars - Disappointing</option>
                    <option value="1">1 Star - Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Destination <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    name="destinationId"
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-none focus:border-[#00A8E8] focus:bg-white transition-all"
                  >
                    <option value="">None</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Package <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    name="packageId"
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-none focus:border-[#00A8E8] focus:bg-white transition-all"
                  >
                    <option value="">None</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Review Headline
                </label>
                <input
                  name="title"
                  placeholder="e.g. Unforgettable Honeymoon in Bali"
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-none focus:border-[#00A8E8] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Your Feedback *
                </label>
                <textarea
                  name="comment"
                  required
                  rows={4}
                  placeholder="Share details about your itinerary, stays, and experience..."
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 outline-none focus:border-[#00A8E8] focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3.5 bg-[#00A8E8] hover:bg-[#0284c7] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </section>

          {/* 2. TRAVELER REVIEWS DISPLAY GRID (BELOW FORM) */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-[#031838]">
              Traveler Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 font-medium">
                  No reviews published yet. Be the first to share your journey above!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-[#00A8E8]/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-1 text-amber-400 mb-3">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>

                      {rev.title && (
                        <h3 className="font-bold text-[#031838] text-base mb-2 leading-snug">
                          {rev.title}
                        </h3>
                      )}

                      <p className="text-slate-600 text-sm italic leading-relaxed mb-6">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="font-bold text-xs text-[#031838]">
                        {rev.user.fullName}
                      </p>
                      <p className="text-[11px] text-[#00A8E8] font-medium mt-0.5">
                        {rev.package?.title ?? rev.destination?.name ?? "Custom Journey"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}