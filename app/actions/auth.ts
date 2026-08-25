"use server";

import { z } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import {
  clearSession,
  createSession,
  hashPassword,
  hasUsablePassword,
  verifyPassword,
} from "../lib/auth";
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

// A fixed, non-secret scrypt hash — never derived from a real password —
// used as the comparison target when there's no usable password to check
// against (account doesn't exist, or only has the enquiry-flow placeholder
// hash — see hasUsablePassword). This makes verifyPassword() run its full
// cost either way, so response timing can't be used to enumerate which
// emails have real accounts.
const DUMMY_PASSWORD_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;

// Plain `===` on a secret (the admin password) leaks timing information
// proportional to how many leading characters match. Comparing fixed-length
// digests with timingSafeEqual removes that signal, and sidesteps
// timingSafeEqual's requirement that both buffers be the same length (raw
// input strings won't be, in general).
function timingSafeStringEqual(a: string, b: string) {
  const aHash = createHash("sha256").update(a).digest();
  const bHash = createHash("sha256").update(b).digest();
  return timingSafeEqual(aHash, bHash);
}

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

    // Previously checked `existing?.passwordHash` truthiness, which was
    // always true for users created via actions/enquiry.ts (they got a
    // real hashPassword() of a random UUID as a placeholder) — meaning
    // anyone who'd ever submitted the enquiry form was permanently
    // blocked from signing up with that email. hasUsablePassword()
    // recognizes the enquiry-flow placeholder specifically and treats it
    // the same as "no password set yet", so this now correctly falls
    // through to the update-existing-row branch below instead.
    if (hasUsablePassword(existing?.passwordHash)) {
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

    const usablePassword = hasUsablePassword(user?.passwordHash);

    // Always run verifyPassword, whether or not there's a usable password
    // to check against, so response timing can't distinguish "no account",
    // "enquiry-only account with no password set", and "wrong password".
    const passwordValid = await verifyPassword(
      parsed.data.password,
      usablePassword ? user.passwordHash : DUMMY_PASSWORD_HASH
    );

    if (!usablePassword || !passwordValid) {
      return { ok: false, message: "Email or password is incorrect." };
    }

    await createSession(user!.id);
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

    const envAdminMatch = Boolean(
      envEmail &&
        envPassword &&
        email === envEmail &&
        timingSafeStringEqual(password, envPassword)
    );

    if (envAdminMatch && envPassword) {
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
    const usablePassword = hasUsablePassword(adminUser?.passwordHash);

    // Same constant-time reasoning as logIn(): run verifyPassword either
    // way so a nonexistent admin email and a wrong password for a real
    // admin email take the same amount of time to reject.
    const passwordValid = await verifyPassword(
      password,
      usablePassword ? adminUser.passwordHash : DUMMY_PASSWORD_HASH
    );

    if (!adminUser || adminUser.role !== "admin" || !usablePassword || !passwordValid) {
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