import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, Compass, Plus } from "lucide-react";

import { getPrisma } from "@/app/lib/db";
import { ImageUploader } from "../components/image-uploader";
import { JourneyManager } from "./journey-manager";

export const dynamic = "force-dynamic";

function revalidateAllJourneys() {
  revalidatePath("/admin/journeys");
  revalidatePath("/journeys");
  revalidatePath("/");
}

async function createJourney(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const destinationId = String(formData.get("destinationId") ?? "").trim() || null;
  const durationDays = parseInt(String(formData.get("durationDays") ?? "7"), 10);
  const durationNights = parseInt(String(formData.get("durationNights") ?? "6"), 10);
  const rawItinerary = String(formData.get("itinerary") ?? "[]").trim();

  let itinerary = [];
  try {
    itinerary = JSON.parse(rawItinerary);
  } catch (e) {
    itinerary = [];
  }

  const rawImages = formData.getAll("images");
  const images = rawImages.map((img) => String(img).trim()).filter(Boolean);

  const slug =
    rawSlug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  if (!title || !summary) {
    redirect("/admin/journeys?error=missing-fields");
  }

  try {
    await prisma.package.create({
      data: {
        title,
        slug,
        summary,
        description: description || summary,
        images,
        heroImageUrl: images[0] || null,
        currency: "INR",
        durationDays,
        durationNights,
        destinationId,
        tripStyle: "Custom",
        isPublished: true,
        itinerary,
        gallery: [],
        highlights: [],
        inclusions: [],
        exclusions: [],
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/admin/journeys?error=db-error");
  }

  revalidateAllJourneys();
  redirect("/admin/journeys");
}

async function updateJourney(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const destinationId = String(formData.get("destinationId") ?? "").trim() || null;
  const durationDays = parseInt(String(formData.get("durationDays") ?? "1"), 10);
  const durationNights = parseInt(String(formData.get("durationNights") ?? "0"), 10);
  const isPublished =
    formData.get("isPublished") === "on" || formData.get("isPublished") === "true";

  const rawItinerary = String(formData.get("itinerary") ?? "[]").trim();
  let itinerary = [];
  try {
    itinerary = JSON.parse(rawItinerary);
  } catch (e) {
    itinerary = [];
  }

  const rawImages = formData.getAll("images");
  const images = rawImages.map((img) => String(img).trim()).filter(Boolean);

  if (!id || !title || !summary) {
    redirect("/admin/journeys?error=missing-fields");
  }

  try {
    await prisma.package.update({
      where: { id },
      data: {
        title,
        slug,
        summary,
        description,
        destinationId,
        durationDays,
        durationNights,
        isPublished,
        images,
        itinerary,
        heroImageUrl: images[0] || null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/admin/journeys?error=db-error");
  }

  revalidateAllJourneys();
  redirect("/admin/journeys");
}

async function deleteJourney(formData: FormData) {
  "use server";

  const prisma = getPrisma();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) return;

  try {
    await prisma.package.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete journey:", error);
  }

  revalidateAllJourneys();
  redirect("/admin/journeys");
}

export default async function AdminJourneysPage() {
  const prisma = getPrisma();

  const [journeys, destinations] = await Promise.all([
    prisma.package.findMany({
      orderBy: { createdAt: "desc" },
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
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              Admin Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Journeys</h1>
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
        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
          {/* Creation Form */}
          <section className="h-fit rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 border-b border-white/5 pb-4">
              <Plus className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">Add New Journey</h2>
            </div>

            <form action={createJourney} className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Hanoi & Halong Bay Express"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="destinationId" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Destination Country
                </label>
                <select
                  id="destinationId"
                  name="destinationId"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-sky-500"
                >
                  <option value="">-- Select Destination --</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="durationNights" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Nights
                  </label>
                  <input
                    type="number"
                    id="durationNights"
                    name="durationNights"
                    defaultValue={4}
                    min={0}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2 text-sm text-white outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="durationDays" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Days
                  </label>
                  <input
                    type="number"
                    id="durationDays"
                    name="durationDays"
                    defaultValue={5}
                    min={1}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2 text-sm text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="slug" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Slug <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  id="slug"
                  name="slug"
                  placeholder="hanoi-halong-bay"
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
                  rows={2}
                  placeholder="Brief trip overview..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="itinerary" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Itinerary JSON <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  id="itinerary"
                  name="itinerary"
                  rows={3}
                  placeholder='[{"day": "1", "title": "Arrival & City Tour"}]'
                  className="w-full font-mono rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-sky-500"
                />
              </div>

              <div>
                <ImageUploader label="Journey Images" fieldName="images" />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-sky-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              >
                Save Journey
              </button>
            </form>
          </section>

          {/* Existing Journeys List */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 border-b border-white/5 pb-4">
              <Compass className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                Existing Journeys ({journeys.length})
              </h2>
            </div>

            <JourneyManager
              journeys={journeys}
              destinations={destinations}
              updateAction={updateJourney}
              deleteAction={deleteJourney}
            />
          </section>
        </div>
      </div>
    </main>
  );
}