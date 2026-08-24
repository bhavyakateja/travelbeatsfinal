"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../lib/auth";
import { getPrisma } from "../lib/db";
import { fallbackDestinations } from "../lib/data";
import { getJourneys } from "../lib/content";

const wishlistSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(["DESTINATION", "PACKAGE"]),
});

export type WishlistActionState = {
  ok: boolean;
  message: string;
  active: boolean;
};

export async function toggleWishlist(
  _previous: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const parsed = wishlistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Invalid wishlist request.", active: false };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      message: "Please sign in to save items to your wishlist.",
      active: false,
    };
  }

  try {
    const prisma = getPrisma();
    const { itemId, itemType } = parsed.data;

    // -------------------------------------------------------------
    // DESTINATION HANDLER
    // -------------------------------------------------------------
    if (itemType === "DESTINATION") {
      const fallback = fallbackDestinations.find((dest) => dest.id === itemId);

      if (fallback) {
        await prisma.destination.upsert({
          where: { id: fallback.id },
          update: {
            name: fallback.name,
            slug: fallback.slug,
            country: fallback.country,
            region: fallback.region,
            summary: fallback.summary,
            description: fallback.description,
            heroImageUrl: fallback.image,
          },
          create: {
            id: fallback.id,
            name: fallback.name,
            slug: fallback.slug,
            country: fallback.country,
            region: fallback.region,
            summary: fallback.summary,
            description: fallback.description,
            heroImageUrl: fallback.image,
            isPublished: true,
          },
        });
      }

      const destination = await prisma.destination.findUnique({
        where: { id: itemId },
        select: { id: true },
      });

      if (!destination) {
        return { ok: false, message: "Destination unavailable.", active: false };
      }

      const existing = await prisma.wishlistItem.findFirst({
        where: { userId: user.id, destinationId: itemId },
        select: { id: true },
      });

      if (existing) {
        await prisma.wishlistItem.delete({ where: { id: existing.id } });
        revalidatePath("/wishlist");
        revalidatePath("/destinations");
        return { ok: true, message: "Removed from wishlist.", active: false };
      }

      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          itemType: "DESTINATION",
          destinationId: itemId,
        },
      });

      revalidatePath("/wishlist");
      revalidatePath("/destinations");
      return { ok: true, message: "Saved to wishlist.", active: true };
    }

    // -------------------------------------------------------------
    // PACKAGE / JOURNEY HANDLER
    // -------------------------------------------------------------
    const journeys = await getJourneys();
    const fallbackJourney = journeys.find((j) => j.id === itemId);

    if (fallbackJourney) {
      await prisma.package.upsert({
        where: { id: fallbackJourney.id },
        update: {
          title: fallbackJourney.title,
          slug: fallbackJourney.slug,
          summary: fallbackJourney.summary,
        },
        create: {
          id: fallbackJourney.id,
          title: fallbackJourney.title,
          slug: fallbackJourney.slug,
          summary: fallbackJourney.summary,
          isPublished: true,
        },
      });
    }

    const journeyPackage = await prisma.package.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!journeyPackage) {
      return { ok: false, message: "Journey unavailable.", active: false };
    }

    const existingPackage = await prisma.wishlistItem.findFirst({
      where: { userId: user.id, packageId: itemId },
      select: { id: true },
    });

    if (existingPackage) {
      await prisma.wishlistItem.delete({ where: { id: existingPackage.id } });
      revalidatePath("/wishlist");
      revalidatePath("/journeys");
      return { ok: true, message: "Removed from wishlist.", active: false };
    }

    await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        itemType: "PACKAGE",
        packageId: itemId,
      },
    });

    revalidatePath("/wishlist");
    revalidatePath("/journeys");
    return { ok: true, message: "Saved to wishlist.", active: true };
  } catch (error) {
    console.error("Wishlist Toggle Error:", error);
    return {
      ok: false,
      message: "We could not update your wishlist. Please try again.",
      active: false,
    };
  }
}

export async function removeWishlistItem(formData: FormData) {
  await toggleWishlist({ ok: false, message: "", active: false }, formData);
}