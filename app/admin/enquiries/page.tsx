import Link from "next/link";
import { ArrowLeft, Calendar, Hash, MapPin, Mail, MessageSquare } from "lucide-react";
import { getPrisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const prisma = getPrisma();
  const enquiries = await prisma.enquiry.findMany({
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
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              Admin Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Enquiries</h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to dashboard</span>
          </Link>
        </header>

        {/* Content */}
        {enquiries.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-12 text-center text-slate-500">
            No customer enquiries received yet.
          </div>
        ) : (
          <div className="space-y-4">
            {enquiries.map((enquiry) => {
              const statusKey = String(enquiry.status).toLowerCase();
              const typeKey = String(enquiry.type).toLowerCase();

              return (
                <div
                  key={enquiry.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition hover:border-white/20"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="font-semibold text-white">
                        {enquiry.user?.fullName || "Guest User"}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>{enquiry.user?.email || "No email provided"}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium">
                      <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-sky-300 capitalize">
                        {typeKey}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 capitalize ${
                          statusKey === "resolved" || statusKey === "confirmed"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : statusKey === "cancelled" || statusKey === "closed"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {statusKey}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 text-xs text-slate-300 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-950/40 p-3 border border-white/5">
                      <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                        <Hash className="h-3 w-3" /> Reference
                      </p>
                      <p className="mt-1 font-mono text-sm font-medium text-white">
                        {enquiry.reference || "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 p-3 border border-white/5">
                      <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                        <MapPin className="h-3 w-3" /> Destination / Package
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {enquiry.destination?.name ?? enquiry.package?.title ?? "Custom Trip"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950/40 p-3 border border-white/5">
                      <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                        <Calendar className="h-3 w-3" /> Travel Dates
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {enquiry.travelStart
                          ? new Date(enquiry.travelStart).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Flexible"}{" "}
                        →{" "}
                        {enquiry.travelEnd
                          ? new Date(enquiry.travelEnd).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Flexible"}
                      </p>
                    </div>
                  </div>

                  {enquiry.message && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3.5 text-xs text-slate-300">
                      <div className="mb-1 flex items-center gap-1.5 font-medium text-slate-400">
                        <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                        <span>Message:</span>
                      </div>
                      <p className="leading-relaxed">{enquiry.message}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}