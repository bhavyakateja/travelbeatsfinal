import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Plus, Tag, Clock, MapPin, User, Package } from "lucide-react";

import { getPrisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

async function createJournalPost(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "The Travel Beats").trim();
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim() || null;
  const coverImageAlt = String(formData.get("coverImageAlt") ?? "").trim() || null;
  const destinationId = String(formData.get("destinationId") ?? "").trim() || null;

  const packageIds = formData
    .getAll("recommendedPackageIds")
    .map((id) => String(id).trim())
    .filter(Boolean);

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug =
    rawSlug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  if (!title || !excerpt || !body) {
    redirect("/admin/journal?error=missing-fields");
  }

  // Calculate estimated reading time (~200 words per minute)
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  try {
    await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        body,
        tags,
        authorName,
        coverImageUrl,
        coverImageAlt,
        readingMinutes,
        isPublished: true,
        publishedAt: new Date(),
        ...(destinationId ? { destination: { connect: { id: destinationId } } } : {}),
        ...(packageIds.length > 0
          ? { recommendedPackages: { connect: packageIds.map((id) => ({ id })) } }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/admin/journal?error=db-error");
  }

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  redirect("/admin/journal");
}

export default async function AdminJournalPage() {
  const prisma = getPrisma();

  // Fetch posts with relation context
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      destination: { select: { name: true } },
      recommendedPackages: { select: { id: true, title: true } },
    },
    take: 100,
  });

  // Fetch destinations and packages for option inputs
  const destinations = await prisma.destination.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // FIXED: Changed prisma.travelPackage to prisma.package
  const packages = await prisma.package.findMany({
    where: { isPublished: true, archivedAt: null },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
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
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Journal Posts
            </h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to dashboard</span>
          </Link>
        </header>

        {/* Content Layout */}
        <div className="grid gap-8 lg:grid-cols-[460px_1fr]">
          {/* Create Form */}
          <section className="h-fit rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 border-b border-white/5 pb-4">
              <Plus className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">Add Journal Post</h2>
            </div>

            <form action={createJournalPost} className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Title *
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Whispers of the Valley"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="slug" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Slug <span className="text-slate-500">(Auto-generated)</span>
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    placeholder="whispers-of-the-valley"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="authorName" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Author Name
                  </label>
                  <input
                    id="authorName"
                    name="authorName"
                    defaultValue="The Travel Beats"
                    placeholder="The Travel Beats"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="destinationId" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Destination <span className="text-slate-500">(Optional)</span>
                </label>
                <select
                  id="destinationId"
                  name="destinationId"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">None / General Travel</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="coverImageUrl" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Cover Image URL
                  </label>
                  <input
                    id="coverImageUrl"
                    name="coverImageUrl"
                    placeholder="/media/journey-sky.jpg"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="coverImageAlt" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Cover Image Alt Text
                  </label>
                  <input
                    id="coverImageAlt"
                    name="coverImageAlt"
                    placeholder="Misty valley morning"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Tags <span className="text-slate-500">(Comma separated)</span>
                </label>
                <input
                  id="tags"
                  name="tags"
                  placeholder="Mountains, Culture, Itinerary"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {packages.length > 0 && (
                <div>
                  <label htmlFor="recommendedPackageIds" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Attach Recommended Packages <span className="text-slate-500">(Hold Cmd/Ctrl to select multiple)</span>
                  </label>
                  <select
                    id="recommendedPackageIds"
                    name="recommendedPackageIds"
                    multiple
                    className="h-24 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id} className="p-1 hover:bg-slate-800">
                        {pkg.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="excerpt" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Excerpt *
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  required
                  rows={2}
                  placeholder="Brief post summary for cards..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="body" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Body Content * <span className="text-slate-500">(Separate paragraphs with double enter)</span>
                </label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={6}
                  placeholder="Write post body content..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-sky-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              >
                Publish Post
              </button>
            </form>
          </section>

          {/* Posts List */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 border-b border-white/5 pb-4">
              <BookOpen className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Published Posts ({posts.length})
              </h2>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-slate-500">
                No journal posts published yet. Use the form on the left to write one.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="group rounded-xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-500/30 hover:bg-slate-950/80"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white transition group-hover:text-sky-300">
                            {post.title}
                          </h3>
                          {post.destination?.name && (
                            <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/20">
                              <MapPin className="h-2.5 w-2.5" />
                              {post.destination.name}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-mono text-slate-500">/{post.slug}</p>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          post.isPublished
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-slate-700 bg-slate-800 text-slate-400"
                        }`}
                      >
                        {post.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-300">
                      {post.excerpt}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span>{post.authorName}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{post.readingMinutes} min read</span>
                      </div>

                      {post.recommendedPackages.length > 0 && (
                        <div className="flex items-center gap-1 text-sky-400">
                          <Package className="h-3.5 w-3.5" />
                          <span>{post.recommendedPackages.length} package(s) attached</span>
                        </div>
                      )}

                      {post.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-slate-500" />
                          <div className="flex flex-wrap gap-1">
                            {post.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}