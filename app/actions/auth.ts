"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { clearSession, createSession, hashPassword, verifyPassword } from "../lib/auth";
import { getPrisma } from "../lib/db";

export type AuthActionState = { ok: boolean; message: string } | null;

const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(1).max(128),
});

export async function signUp(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Use a name, valid email, and password of 8+ characters." };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing?.passwordHash) {
      return { ok: false, message: "An account already exists for this email." };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { fullName: parsed.data.fullName, passwordHash },
        })
      : await prisma.user.create({
          data: { fullName: parsed.data.fullName, email, passwordHash },
        });

    await createSession(user.id);
  } catch {
    return { ok: false, message: "We could not create your account right now." };
  }

  redirect("/");
}

export async function logIn(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email and password." };
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await getPrisma().user.findUnique({ where: { email } });

    if (user?.role === "admin") {
      return { ok: false, message: "Use the admin login page to access the dashboard." };
    }

    if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return { ok: false, message: "Email or password is incorrect." };
    }

    await createSession(user.id);
  } catch {
    return { ok: false, message: "We could not sign you in right now." };
  }

  redirect("/");
}

export async function adminLogIn(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid admin email and password." };
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;
    const prisma = getPrisma();

    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envPassword = process.env.ADMIN_PASSWORD;

    const envAdminMatch =
      envEmail && envPassword && email === envEmail && password === envPassword;

    if (envAdminMatch) {
      const adminUser = await prisma.user.upsert({
        where: { email },
        update: {
          role: "admin",
          fullName: "Travel Beats Admin",
          passwordHash: await hashPassword(envPassword),
        },
        create: {
          email,
          fullName: "Travel Beats Admin",
          passwordHash: await hashPassword(envPassword),
          role: "admin",
        },
      });

      await createSession(adminUser.id);
      redirect("/admin");
    }

    const adminUser = await prisma.user.findUnique({ where: { email } });

    if (!adminUser || adminUser.role !== "admin") {
      return { ok: false, message: "Invalid admin credentials." };
    }

    if (!adminUser.passwordHash || !(await verifyPassword(password, adminUser.passwordHash))) {
      return { ok: false, message: "Invalid admin credentials." };
    }

    await createSession(adminUser.id);
  } catch (error) {
    // Rethrow Next.js redirect errors so navigation succeeds
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return { ok: false, message: "We could not sign you into the admin dashboard." };
  }

  redirect("/admin");
}

export async function logOut() {
  await clearSession();
  redirect("/");
}