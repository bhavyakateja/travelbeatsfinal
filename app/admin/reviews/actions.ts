"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/app/lib/db";

// Match the string literal union expected by your Prisma schema
type ReviewStatus = "APPROVED" | "REJECTED" | "PENDING";

const VALID_STATUSES: ReviewStatus[] = ["APPROVED", "REJECTED", "PENDING"];

export async function updateReviewStatus(formData: FormData) {
  const prisma = getPrisma();
  const reviewId = String(formData.get("reviewId") ?? "");
  const rawStatus = String(formData.get("status") ?? "");

  if (!reviewId || !VALID_STATUSES.includes(rawStatus as ReviewStatus)) {
    throw new Error("Invalid parameters provided.");
  }

  const status = rawStatus as ReviewStatus;

  await prisma.review.update({
    where: { id: reviewId },
    data: { status },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}

export async function addAdminReply(formData: FormData) {
  const prisma = getPrisma();
  const reviewId = String(formData.get("reviewId") ?? "");
  const adminReply = String(formData.get("adminReply") ?? "").trim();

  if (!reviewId || !adminReply) {
    throw new Error("Review ID and reply content are required.");
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { adminReply },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}