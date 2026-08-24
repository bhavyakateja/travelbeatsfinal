"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "../lib/auth";
import { getPrisma } from "../lib/db";

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  state: z.string().trim().max(120),
  city: z.string().trim().max(120),
  pincode: z.string().trim().max(16),
  timezone: z.string().trim().min(1).max(100),
});

export type ProfileUpdate = z.infer<typeof profileSchema>;

export async function updateProfile(data: ProfileUpdate) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const values = profileSchema.parse(data);

  await getPrisma().user.update({
    where: { id: user.id },
    data: {
      fullName: values.fullName,
      phone: values.phone || null,
      whatsapp: values.whatsapp || null,
      state: values.state || null,
      city: values.city || null,
      pincode: values.pincode || null,
      timezone: values.timezone,
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true };
}
