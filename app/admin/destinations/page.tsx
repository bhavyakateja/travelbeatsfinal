import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus, Globe } from "lucide-react";

import { getPrisma } from "@/app/lib/db";
import { ImageUploader } from "../components/image-uploader";
import { DestinationManager } from "./destination-manager";

export const dynamic = "force-dynamic";

export const ALLOWED_TAGS = [
  "Luxury",
  "Romantic",
  "Adventure",
  "Beach",
  "Culture",
  "Family",
  "Nature"
];

function revalidateAllDestinations() {
  revalidatePath("/admin/destinations");
  revalidatePath("/destinations");
  revalidatePath("/destinations/[slug]", "page");
  revalidatePath("/");
}

async function createDestination(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  // Extract checked tags safely
  const rawTags = formData.getAll("tags").map((t) => String(t).trim());
  const tags = rawTags.filter((tag) => ALLOWED_TAGS.includes(tag));

  const rawImages = formData.getAll("images");
  const images = rawImages.map((img) => String(img).trim()).filter(Boolean);

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug =
    rawSlug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  if (!name || !country || !summary) {
    redirect("/admin/destinations?error=missing-fields");
  }

  try {
    await prisma.destination.create({
      data: {
        name,
        country,
        region: region || null,
        slug,
        summary,
        description: description || summary,
        tags,
        images,
        heroImageUrl: images[0] || null,
        isPublished: true,
        sortOrder: 0,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/admin/destinations?error=db-error");
  }

  revalidateAllDestinations();
  redirect("/admin/destinations");
}

async function updateDestination(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  const rawTags = formData.getAll("tags").map((t) => String(t).trim());
  const tags = rawTags.filter((tag) => ALLOWED_TAGS.includes(tag));

  const isPublished =
    formData.get("isPublished") === "on" || formData.get("isPublished") === "true";

  const rawImages = formData.getAll("images");
  const images = rawImages.map((img) => String(img).trim()).filter(Boolean);

  if (!id || !name || !country) {
    redirect("/admin/destinations?error=missing-fields");
  }

  try {
    await prisma.destination.update({
      where: { id },
      data: {
        name,
        country,
        region: region || null,
        slug,
        summary,
        description,
        tags,
        isPublished,
        images,
        heroImageUrl: images[0] || null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/admin/destinations?error=db-error");
  }

  revalidateAllDestinations();
  redirect("/admin/destinations");
}

async function deleteDestination(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) return;

  try {
    await prisma.destination.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete destination:", error);
  }

  revalidateAllDestinations();
  redirect("/admin/destinations");
}

export default async function AdminDestinationsPage() {
  const prisma = getPrisma();
  const destinations = await prisma.destination.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              Admin Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Destinations</h1>
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
              <h2 className="text-lg font-semibold text-white">Add Destination</h2>
            </div>

            <form action={createDestination} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Paris"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="country" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  required
                  placeholder="e.g. France"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="region" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Region <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  id="region"
                  name="region"
                  placeholder="e.g. Île-de-France"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Tag Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Categories / Tags
                </label>
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-slate-950/80 p-3">
                  {ALLOWED_TAGS.map((tag) => (
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
              </div>

              <div>
                <label htmlFor="slug" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Slug <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  id="slug"
                  name="slug"
                  placeholder="paris-france"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="summary" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Summary
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  required
                  rows={3}
                  placeholder="Brief overview..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Description <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Detailed description..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <ImageUploader label="Destination Images" fieldName="images" />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-sky-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              >
                Save Destination
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 border-b border-white/5 pb-4">
              <Globe className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Existing Destinations ({destinations.length})
              </h2>
            </div>

            <DestinationManager
              destinations={destinations}
              allowedTags={ALLOWED_TAGS}
              updateAction={updateDestination}
              deleteAction={deleteDestination}
            />
          </section>
        </div>
      </div>
    </main>
  );
}