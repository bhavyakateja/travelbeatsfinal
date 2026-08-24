import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Building2,
  Compass,
  HeartHandshake,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { requireAdminUser } from "@/app/lib/admin";
import { getPrisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdminUser();
  const prisma = getPrisma();

  const [destinations, journeys, journalPosts, users, enquiries, reviews] =
    await Promise.all([
      prisma.destination.count({ where: { archivedAt: null } }),
      prisma.package.count({ where: { archivedAt: null } }),
      prisma.blogPost.count({ where: { archivedAt: null } }),
      prisma.user.count(),
      prisma.enquiry.count({ where: { archivedAt: null } }),
      prisma.review.count(),
    ]);

  const cards = [
    { label: "Destinations", count: destinations, icon: Compass, href: "/admin/destinations" },
    { label: "Journeys", count: journeys, icon: Building2, href: "/admin/journeys" },
    { label: "Journal Posts", count: journalPosts, icon: BookOpenText, href: "/admin/journal" },
    { label: "Users", count: users, icon: Users, href: "/admin/users" },
    { label: "Enquiries", count: enquiries, icon: MessageSquareText, href: "/admin/enquiries" },
    { label: "Reviews", count: reviews, icon: HeartHandshake, href: "/admin/reviews" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              Admin Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Signed in as {admin.fullName}</span>
            </div>

            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        {/* Unified Cards Grid */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ label, count, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-sky-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-sky-500/5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-sky-500/10 p-3 text-sky-400 transition-colors group-hover:bg-sky-500 group-hover:text-slate-950">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-400" />
                </div>
                <p className="mt-6 text-xs font-medium uppercase tracking-wider text-slate-400">
                  {label}
                </p>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-4xl font-extrabold tracking-tight text-white">
                  {count.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-sky-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Manage &rarr;
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}