"use client";

import { useState } from "react";
import { Images, Edit2, Trash2, X, Save } from "lucide-react";
import { ImageUploader } from "../components/image-uploader";

type JourneyItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  images: string[];
  heroImageUrl: string | null;
  isPublished: boolean;
  durationDays: number;
  durationNights: number;
  destinationId: string | null;
  itinerary: any;
};

type DestinationOption = {
  id: string;
  name: string;
};

interface JourneyManagerProps {
  journeys: JourneyItem[];
  destinations: DestinationOption[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function JourneyManager({
  journeys,
  destinations,
  updateAction,
  deleteAction,
}: JourneyManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (journeys.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-slate-500">
        No journeys added yet. Use the form on the left to add one.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {journeys.map((journey) => {
        const isEditing = editingId === journey.id;
        const isDeleting = deletingId === journey.id;
        const imageCount = journey.images?.length || (journey.heroImageUrl ? 1 : 0);

        if (isEditing) {
          return (
            <div
              key={journey.id}
              className="rounded-2xl border border-sky-500/40 bg-slate-900/90 p-5 shadow-xl transition"
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Edit2 className="h-4 w-4" />
                  <h3 className="text-sm font-semibold text-white">
                    Edit Journey: {journey.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form action={updateAction} className="space-y-4">
                <input type="hidden" name="id" value={journey.id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={journey.title}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Destination Country
                    </label>
                    <select
                      name="destinationId"
                      defaultValue={journey.destinationId || ""}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    >
                      <option value="">-- Select Destination --</option>
                      {destinations.map((dest) => (
                        <option key={dest.id} value={dest.id}>
                          {dest.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Slug
                    </label>
                    <input
                      type="text"
                      name="slug"
                      defaultValue={journey.slug}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Nights
                    </label>
                    <input
                      type="number"
                      name="durationNights"
                      defaultValue={journey.durationNights}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Days
                    </label>
                    <input
                      type="number"
                      name="durationDays"
                      defaultValue={journey.durationDays}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Summary
                  </label>
                  <textarea
                    name="summary"
                    defaultValue={journey.summary}
                    required
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Itinerary JSON
                  </label>
                  <textarea
                    name="itinerary"
                    defaultValue={
                      typeof journey.itinerary === "string"
                        ? journey.itinerary
                        : JSON.stringify(journey.itinerary ?? [], null, 2)
                    }
                    rows={3}
                    className="w-full font-mono rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id={`published-${journey.id}`}
                    name="isPublished"
                    defaultChecked={journey.isPublished}
                    className="h-4 w-4 rounded border-white/10 bg-slate-950 text-sky-500 focus:ring-sky-500"
                  />
                  <label
                    htmlFor={`published-${journey.id}`}
                    className="text-xs font-medium text-slate-200"
                  >
                    Published on website
                  </label>
                </div>

                <div>
                  <ImageUploader
                    label="Journey Images"
                    fieldName="images"
                    initialImages={journey.images}
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          );
        }

        return (
          <div
            key={journey.id}
            className="group rounded-xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-500/30 hover:bg-slate-950/80"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-white transition group-hover:text-sky-300">
                  {journey.title}
                </h3>
                <div className="mt-0.5 flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span>/{journey.slug}</span>
                  <span>•</span>
                  <span className="text-sky-400 font-sans">
                    {journey.durationNights}N/{journey.durationDays}D
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                  <Images className="h-3 w-3" />
                  {imageCount} {imageCount === 1 ? "img" : "imgs"}
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    journey.isPublished
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  }`}
                >
                  {journey.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300">
              {journey.summary}
            </p>

            {/* Action Bar */}
            <div className="mt-3.5 flex items-center justify-end border-t border-white/5 pt-3">
              <div className="flex items-center gap-2">
                {isDeleting ? (
                  <form action={deleteAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={journey.id} />
                    <span className="text-xs text-rose-400">Delete item?</span>
                    <button
                      type="submit"
                      className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingId(journey.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(journey.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}