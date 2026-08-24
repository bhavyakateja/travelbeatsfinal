import Link from "next/link";
import { ArrowLeft, Star, MessageSquare, Check, X } from "lucide-react";
import { getPrisma } from "@/app/lib/db";
import { updateReviewStatus, addAdminReply } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const prisma = getPrisma();
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true, email: true } },
      destination: { select: { name: true } },
      package: { select: { title: true } },
    },
    take: 200,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              Admin Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Reviews Moderation</h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to dashboard</span>
          </Link>
        </header>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-12 text-center text-slate-500">
            No customer reviews submitted yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition hover:border-white/20"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">
                        {review.user?.fullName || "Anonymous"}
                      </h3>
                      <p className="text-xs text-slate-400">{review.user?.email || "No email provided"}</p>
                      {(review.package?.title || review.destination?.name) && (
                        <span className="mt-1 inline-block text-[11px] font-medium text-sky-400">
                          Target: {review.package?.title ?? review.destination?.name}
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        review.status.toLowerCase() === "approved"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : review.status.toLowerCase() === "rejected"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {review.status.toLowerCase()}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"
                        }`}
                      />
                    ))}
                  </div>

                  {review.title && (
                    <h4 className="mb-1 text-sm font-bold text-slate-200">{review.title}</h4>
                  )}
                  <p className="text-sm leading-relaxed text-slate-300">{review.comment}</p>
                </div>

                <div className="mt-6 space-y-4 pt-4 border-t border-white/10">
                  {review.adminReply ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-200">
                      <div className="mb-1 flex items-center gap-1.5 font-medium text-emerald-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Admin Reply:</span>
                      </div>
                      <p className="leading-relaxed text-slate-300">{review.adminReply}</p>
                    </div>
                  ) : (
                    <form action={addAdminReply} className="flex gap-2">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input
                        name="adminReply"
                        placeholder="Type official reply..."
                        className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition"
                      >
                        Reply
                      </button>
                    </form>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    {review.status !== "APPROVED" && (
                      <form action={updateReviewStatus}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                      </form>
                    )}

                    {review.status !== "REJECTED" && (
                      <form action={updateReviewStatus}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}