"use server";

import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { getCurrentUser, hashPassword, hasUsablePassword, verifyPassword } from "../lib/auth";
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "New passwords do not match.",
});

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

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) throw new Error("Unauthorized");

  try {
    const values = changePasswordSchema.parse(data);

    const user = await getPrisma().user.findUnique({
      where: { id: sessionUser.id },
      select: { passwordHash: true },
    });

    if (!hasUsablePassword(user?.passwordHash) || !(await verifyPassword(values.currentPassword, user.passwordHash))) {
      throw new Error("Your current password is incorrect.");
    }

    await getPrisma().user.update({
      where: { id: sessionUser.id },
      data: { passwordHash: await hashPassword(values.password) },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      // Extract the first clean error message (e.g. "New passwords do not match.")
      throw new Error(error.issues[0]?.message || "Invalid input data.");
    }
    throw error;
  }
}