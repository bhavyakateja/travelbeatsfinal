"use client";

import { useState } from "react";
import { MapPin, Images, Edit2, Trash2, X, Save, Tag } from "lucide-react";
import { ImageUploader } from "../components/image-uploader";

type DestinationItem = {
  id: string;
  name: string;
  country: string;
  region: string | null;
  slug: string;
  summary: string;
  description: string;
  tags?: string[];
  images: string[];
  heroImageUrl: string | null;
  isPublished: boolean;
};

interface DestinationManagerProps {
  destinations: DestinationItem[];
  allowedTags: string[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function DestinationManager({
  destinations,
  allowedTags,
  updateAction,
  deleteAction,
}: DestinationManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (destinations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-slate-500">
        No destinations added yet. Use the form on the left to create one.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {destinations.map((destination) => {
        const isEditing = editingId === destination.id;
        const isDeleting = deletingId === destination.id;
        const imageCount =
          destination.images?.length || (destination.heroImageUrl ? 1 : 0);

        if (isEditing) {
          return (
            <div
              key={destination.id}
              className="rounded-2xl border border-sky-500/40 bg-slate-900/90 p-5 shadow-xl transition"
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Edit2 className="h-4 w-4" />
                  <h3 className="text-sm font-semibold text-white">
                    Edit Destination: {destination.name}
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
                <input type="hidden" name="id" value={destination.id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={destination.name}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      defaultValue={destination.country}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Region
                    </label>
                    <input
                      type="text"
                      name="region"
                      defaultValue={destination.region || ""}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Slug
                    </label>
                    <input
                      type="text"
                      name="slug"
                      defaultValue={destination.slug}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Categories / Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-slate-950/80 p-3">
                    {allowedTags.map((tag) => {
                      const isChecked = destination.tags?.includes(tag);
                      return (
                        <label
                          key={tag}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:border-sky-500/50 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-500/10 has-[:checked]:text-sky-300"
                        >
                          <input
                            type="checkbox"
                            name="tags"
                            value={tag}
                            defaultChecked={isChecked}
                            className="h-3.5 w-3.5 rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <span>{tag}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Summary
                  </label>
                  <textarea
                    name="summary"
                    defaultValue={destination.summary}
                    required
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={destination.description}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id={`published-${destination.id}`}
                    name="isPublished"
                    defaultChecked={destination.isPublished}
                    className="h-4 w-4 rounded border-white/10 bg-slate-950 text-sky-500 focus:ring-sky-500"
                  />
                  <label
                    htmlFor={`published-${destination.id}`}
                    className="text-xs font-medium text-slate-200"
                  >
                    Published on website
                  </label>
                </div>

                <div>
                  <ImageUploader
                    label="Destination Images"
                    fieldName="images"
                    initialImages={destination.images}
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
            key={destination.id}
            className="group rounded-xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-500/30 hover:bg-slate-950/80"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-white transition group-hover:text-sky-300">
                  {destination.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  <span>
                    {destination.country}
                    {destination.region ? ` · ${destination.region}` : ""}
                  </span>
                </p>

                {destination.tags && destination.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {destination.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                      >
                        <Tag className="h-2.5 w-2.5 text-sky-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                  <Images className="h-3 w-3" />
                  {imageCount} {imageCount === 1 ? "img" : "imgs"}
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    destination.isPublished
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  }`}
                >
                  {destination.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-300">
              {destination.summary}
            </p>

            <div className="mt-3.5 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[10px] font-mono text-slate-500">
                /{destination.slug}
              </span>

              <div className="flex items-center gap-2">
                {isDeleting ? (
                  <form action={deleteAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={destination.id} />
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
                      onClick={() => setEditingId(destination.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(destination.id)}
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