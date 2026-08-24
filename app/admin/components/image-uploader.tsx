"use client";

import { useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Plus } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  initialImages?: string[];
  fieldName?: string;
  label?: string;
}

export function ImageUploader({
  initialImages = [],
  fieldName = "images",
  label = "Item Images",
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          setUploadError(data.error || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error("Upload error:", err);
        setUploadError(`Failed to upload ${file.name}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setImages((prev) => [...prev, ...uploadedUrls]);
    }
    setIsUploading(false);
    // Reset file input value
    e.target.value = "";
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setUrlInput("");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">
          {label} ({images.length} {images.length === 1 ? "image" : "images"})
        </label>
        <span className="text-[10px] font-mono text-slate-400">
          Cloudinary direct upload
        </span>
      </div>

      {/* Hidden inputs to pass array of image URLs to form action */}
      {images.map((url, idx) => (
        <input key={idx} type="hidden" name={fieldName} value={url} />
      ))}

      {/* Image Thumbnails Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-4/3 overflow-hidden rounded-xl border border-white/10 bg-slate-950"
            >
              <Image
                src={url}
                alt={`Uploaded image ${idx + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-md transition hover:bg-rose-600"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-white">
                #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* File Upload Trigger */}
      <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-5 text-center transition hover:border-sky-500/50 hover:bg-slate-950/70">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          disabled={isUploading}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        {isUploading ? (
          <div className="flex items-center gap-2 text-sky-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs font-medium">Uploading to Cloudinary...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="mb-2 h-6 w-6 text-sky-400" />
            <p className="text-xs font-medium text-slate-200">
              Click or drag images here to upload
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Supports any image format (JPG, PNG, WEBP, GIF, etc.)
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-rose-400">{uploadError}</p>
      )}

      {/* Alternative direct URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Or paste external image URL..."
          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
}
