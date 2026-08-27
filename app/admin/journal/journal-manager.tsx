"use client";

import { useState } from "react";
import { Clock, Edit2, Trash2, X, Save, Tag, MapPin } from "lucide-react";
import { ImageUploader } from "../components/image-uploader";

type JournalPostItem = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  excerpt: string;
  body: string;
  tags?: string[];
  readingMinutes: number;
  isPublished: boolean;
  destinationId: string | null;
  coverImageUrl: string | null;
  destination?: { id: string; name: string } | null;
};

interface JournalManagerProps {
  posts: JournalPostItem[];
  destinations: { id: string; name: string }[];
  allowedTags: string[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function JournalManager({
  posts,
  destinations,
  allowedTags,
  updateAction,
  deleteAction,
}: JournalManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-slate-500">
        No journal posts added yet. Use the form on the left to create one.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const isEditing = editingId === post.id;
        const isDeleting = deletingId === post.id;

        if (isEditing) {
          const postTags = post.tags || [];
          // Filter out preset tags to pre-fill custom tags input
          const customTagsForPost = postTags.filter(
            (tag) => !allowedTags.includes(tag)
          );

          return (
            <div
              key={post.id}
              className="rounded-2xl border border-sky-500/40 bg-slate-900/90 p-5 shadow-xl transition"
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Edit2 className="h-4 w-4" />
                  <h3 className="text-sm font-semibold text-white">
                    Edit Post: {post.title}
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
                <input type="hidden" name="id" value={post.id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={post.title}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Author Name
                    </label>
                    <input
                      type="text"
                      name="authorName"
                      defaultValue={post.authorName}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
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
                      defaultValue={post.slug}
                      required
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Destination
                    </label>
                    <select
                      name="destinationId"
                      defaultValue={post.destinationId || ""}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
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
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Read Time (mins)
                    </label>
                    <input
                      type="number"
                      name="readingMinutes"
                      defaultValue={post.readingMinutes}
                      min={1}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Categories / Tags
                  </label>
                  <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/80 p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {allowedTags.map((tag) => {
                        const isChecked = postTags.includes(tag);
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
                    <div>
                      <input
                        type="text"
                        name="customTags"
                        defaultValue={customTagsForPost.join(", ")}
                        placeholder="Custom tags (comma separated, e.g. Packing, Budget)"
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    defaultValue={post.excerpt}
                    required
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Body Content
                  </label>
                  <textarea
                    name="body"
                    defaultValue={post.body}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id={`published-${post.id}`}
                    name="isPublished"
                    defaultChecked={post.isPublished}
                    className="h-4 w-4 rounded border-white/10 bg-slate-950 text-sky-500 focus:ring-sky-500"
                  />
                  <label
                    htmlFor={`published-${post.id}`}
                    className="text-xs font-medium text-slate-200"
                  >
                    Published on website
                  </label>
                </div>

                <div>
                  <ImageUploader
                    label="Cover Image"
                    fieldName="coverImageUrl"
                    initialImages={post.coverImageUrl ? [post.coverImageUrl] : []}
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
            key={post.id}
            className="group rounded-xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-sky-500/30 hover:bg-slate-950/80"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-white transition group-hover:text-sky-300">
                  {post.title}
                </h3>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                  <span>By {post.authorName}</span>
                  {post.destination && (
                    <span className="flex items-center gap-1 text-sky-400">
                      <MapPin className="h-3 w-3" />
                      {post.destination.name}
                    </span>
                  )}
                </p>

                {post.tags && post.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {post.tags.map((tag) => (
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
                  <Clock className="h-3 w-3" />
                  {post.readingMinutes} min read
                </span>

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
            </div>

            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-300">
              {post.excerpt}
            </p>

            <div className="mt-3.5 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[10px] font-mono text-slate-500">
                /journal/{post.slug}
              </span>

              <div className="flex items-center gap-2">
                {isDeleting ? (
                  <form action={deleteAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={post.id} />
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
                      onClick={() => setEditingId(post.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-sky-500/20 hover:text-sky-300"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(post.id)}
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