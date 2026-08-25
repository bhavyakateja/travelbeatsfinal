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

type PrismaClientLike = ReturnType<typeof getPrisma>;

// Only touches the DB with a write when the destination is genuinely
// missing. The previous version ran `destination.upsert` unconditionally
// on every toggle whenever the id matched a fallback entry — a full write
// query on the critical path of every single click, even for destinations
// that were already synced.
async function ensureDestinationExists(prisma: PrismaClientLike, itemId: string) {
  const destination = await prisma.destination.findUnique({
    where: { id: itemId },
    select: { id: true },
  });
  if (destination) return true;

  const fallback = fallbackDestinations.find((dest) => dest.id === itemId);
  if (!fallback) return false;

  await prisma.destination.create({
    data: {
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

  return true;
}

// Same idea for packages — the previous version called getJourneys()
// (an uncached findMany) on every single package toggle, whether or not
// the package already existed.
async function ensurePackageExists(prisma: PrismaClientLike, itemId: string) {
  const journeyPackage = await prisma.package.findUnique({
    where: { id: itemId },
    select: { id: true },
  });
  if (journeyPackage) return true;

  const journeys = await getJourneys();
  const fallbackJourney = journeys.find((journey) => journey.id === itemId);
  if (!fallbackJourney) return false;

  await prisma.package.create({
    data: {
      id: fallbackJourney.id,
      title: fallbackJourney.title,
      slug: fallbackJourney.slug,
      summary: fallbackJourney.summary,
      isPublished: true,
    },
  });

  return true;
}

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

  const { itemId, itemType } = parsed.data;

  try {
    const prisma = getPrisma();

    const exists =
      itemType === "DESTINATION"
        ? await ensureDestinationExists(prisma, itemId)
        : await ensurePackageExists(prisma, itemId);

    if (!exists) {
      return {
        ok: false,
        message:
          itemType === "DESTINATION" ? "Destination unavailable." : "Journey unavailable.",
        active: false,
      };
    }

    const where =
      itemType === "DESTINATION"
        ? { userId: user.id, destinationId: itemId }
        : { userId: user.id, packageId: itemId };

    const revalidateTargets =
      itemType === "DESTINATION" ? ["/wishlist", "/destinations"] : ["/wishlist", "/journeys"];

    // Try removal first. A single indexed deleteMany tells us in ONE round
    // trip whether the item was already saved, instead of the previous
    // findFirst (1 query) + delete (1 query) pair.
    const removed = await prisma.wishlistItem.deleteMany({ where });

    if (removed.count > 0) {
      revalidateTargets.forEach((path) => revalidatePath(path));
      return { ok: true, message: "Removed from wishlist.", active: false };
    }

    await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        itemType,
        ...(itemType === "DESTINATION" ? { destinationId: itemId } : { packageId: itemId }),
      },
    });

    revalidateTargets.forEach((path) => revalidatePath(path));
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