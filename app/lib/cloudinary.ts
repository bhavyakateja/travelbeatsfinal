import "server-only";

import { createHash } from "node:crypto";

const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getCloudinaryConfig() {
  return {
    cloudName: required("CLOUDINARY_CLOUD_NAME"),
    apiKey: required("CLOUDINARY_API_KEY"),
    apiSecret: required("CLOUDINARY_API_SECRET"),
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
  };
}

export function createCloudinarySignature(params: Record<string, string | number>) {
  const { apiSecret } = getCloudinaryConfig();
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export async function uploadToCloudinary(file: File, folder = "travel-beats") {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = createCloudinarySignature(params);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const response = await fetch(`${CLOUDINARY_API_BASE}/${config.cloudName}/auto/upload`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Cloudinary upload failed: ${message}`);
  }

  return (await response.json()) as {
    secure_url: string;
    public_id: string;
    resource_type: string;
    width?: number;
    height?: number;
  };
}
