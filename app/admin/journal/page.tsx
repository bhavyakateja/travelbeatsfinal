import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus, BookOpen } from "lucide-react";

import { getPrisma } from "@/app/lib/db";
import { ImageUploader } from "../components/image-uploader";
import { JournalManager } from "./journal-manager";

export const dynamic = "force-dynamic";

export const ALLOWED_JOURNAL_TAGS = [
  "Guides",
  "Tips",
  "Culture",
  "Food",
  "Itinerary",
  "Luxury",
  "Adventure",
];

function revalidateAllJournal() {
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath("/journal/[slug]", "page");
  revalidatePath("/");
}

// Helper to extract and sanitize tags from form submission
function parseSubmittedTags(formData: FormData): string[] {
  const selectedPresetTags = formData.getAll("tags").map((t) => String(t).trim());
  const customTagsRaw = String(formData.get("customTags") ?? "").trim();
  
  const customTags = customTagsRaw
    ? customTagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  // Combine and deduplicate tags while preserving casing
  const combined = Array.from(new Set([...selectedPresetTags, ...customTags]));
  return combined;
}

async function createJournalPost(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const title = String(formData.get("title") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim() || "The Travel Beats";
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const destinationId = String(formData.get("destinationId") ?? "").trim() || null;
  const readingMinutes = parseInt(String(formData.get("readingMinutes") ?? "5"), 10) || 5;

  const tags = parseSubmittedTags(formData);

  const rawImages = formData.getAll("coverImageUrl");
  const coverImageUrl = rawImages.map((img) => String(img).trim()).filter(Boolean)[0] || null;

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug =
    rawSlug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  if (!title || !excerpt) {
    redirect("/admin/journal?error=missing-fields");
  }

  try {
    await prisma.blogPost.create({
      data: {
        title,
        slug,
        authorName,
        excerpt,
        body,
        tags,
        readingMinutes,
        destinationId,
        coverImageUrl,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/admin/journal?error=db-error");
  }

  revalidateAllJournal();
  redirect("/admin/journal");
}

async function updateJournalPost(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim() || "The Travel Beats";
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const destinationId = String(formData.get("destinationId") ?? "").trim() || null;
  const readingMinutes = parseInt(String(formData.get("readingMinutes") ?? "5"), 10) || 5;

  const tags = parseSubmittedTags(formData);

  const isPublished =
    formData.get("isPublished") === "on" || formData.get("isPublished") === "true";

  const rawImages = formData.getAll("coverImageUrl");
  const coverImageUrl = rawImages.map((img) => String(img).trim()).filter(Boolean)[0] || null;

  if (!id || !title || !excerpt) {
    redirect("/admin/journal?error=missing-fields");
  }

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id } });

    await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        authorName,
        excerpt,
        body,
        tags,
        readingMinutes,
        destinationId,
        isPublished,
        publishedAt: isPublished ? existing?.publishedAt || new Date() : null,
        coverImageUrl,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/admin/journal?error=db-error");
  }

  revalidateAllJournal();
  redirect("/admin/journal");
}

async function deleteJournalPost(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) return;

  try {
    await prisma.blogPost.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete journal post:", error);
  }

  revalidateAllJournal();
  redirect("/admin/journal");
}

export default async function AdminJournalPage() {
  const prisma = getPrisma();

  const [posts, destinations] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { destination: { select: { id: true, name: true } } },
      take: 100,
    }),
    prisma.destination.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              Admin Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Journal Posts</h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to dashboard</span>
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="h-fit rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 border-b border-white/5 pb-4">
              <Plus className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">Add Journal Article</h2>
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
                  placeholder="e.g. 10 Secret Hidden Gems in Kyoto"
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
                  placeholder="e.g. The Travel Beats"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="destinationId" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Linked Destination
                  </label>
                  <select
                    id="destinationId"
                    name="destinationId"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-sky-500"
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
                  <label htmlFor="readingMinutes" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Read Time (mins)
                  </label>
                  <input
                    type="number"
                    id="readingMinutes"
                    name="readingMinutes"
                    defaultValue={5}
                    min={1}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Categories / Tags
                </label>
                <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/80 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {ALLOWED_JOURNAL_TAGS.map((tag) => (
                      <label
                        key={tag}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:border-sky-500/50 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-500/10 has-[:checked]:text-sky-300"
                      >
                        <input
                          type="checkbox"
                          name="tags"
                          value={tag}
                          className="h-3.5 w-3.5 rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="customTags"
                      placeholder="Custom tags (comma separated, e.g. Packing, Budget)"
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="slug" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Slug <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  id="slug"
                  name="slug"
                  placeholder="10-secret-hidden-gems-in-kyoto"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="excerpt" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Excerpt *
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  required
                  rows={2}
                  placeholder="Short summary for post preview..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="body" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Body Content
                </label>
                <textarea
                  id="body"
                  name="body"
                  rows={6}
                  placeholder="Full article body content..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <ImageUploader label="Cover Image" fieldName="coverImageUrl" />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-sky-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              >
                Save Article
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 border-b border-white/5 pb-4">
              <BookOpen className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Existing Articles ({posts.length})
              </h2>
            </div>

            <JournalManager
              posts={posts}
              destinations={destinations}
              allowedTags={ALLOWED_JOURNAL_TAGS}
              updateAction={updateJournalPost}
              deleteAction={deleteJournalPost}
            />
          </section>
        </div>
      </div>
    </main>
  );
}