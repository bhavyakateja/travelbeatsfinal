"use server";

import { z } from "zod";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { Resend } from "resend";
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

const passwordSchema = z.object({
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(180),
});

const passwordResetSchema = passwordSchema.extend({
  token: z.string().min(32).max(256),
});

const PASSWORD_RESET_LIFETIME_MS = 1000 * 60 * 30;
const PASSWORD_RESET_COOLDOWN_MS = 1000 * 60 * 2;
const RESET_REQUEST_MESSAGE = "If an account exists for that email, we have sent a password reset link.";

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function passwordResetUrl(token: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = new URL("/auth/reset-password", siteUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

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

/*
 * ---------------------------------------------------------
 * PASSWORD RESET EMAIL (runs AFTER the response is sent)
 * ---------------------------------------------------------
 * Previously this was awaited inline before requestPasswordReset()
 * returned, meaning the user's form submission waited on Resend's API
 * round trip. The response message is identical regardless of outcome
 * (see RESET_REQUEST_MESSAGE) by design, so there's no correctness reason
 * to make the request wait on it — same reasoning as the enquiry emails.
 * If delivery fails or Resend isn't configured, the token is deleted here
 * so an unreachable, unusable token isn't left sitting in the DB.
 */
async function sendPasswordResetEmail(
  tokenId: string,
  user: { email: string; fullName: string },
  token: string
) {
  const prisma = getPrisma();

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    await prisma.passwordResetToken.delete({ where: { id: tokenId } }).catch(() => {});
    return;
  }

  try {
    const emailResult = await new Resend(resendApiKey).emails.send({
      from: fromEmail,
      to: user.email,
      subject: "Reset your Travel Beats password",
      html: `<p>Hello ${escapeHtml(user.fullName)},</p><p>Use the link below to set a new password. It expires in 30 minutes.</p><p><a href="${passwordResetUrl(token)}">Reset my password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message || "Resend email delivery failed");
    }
  } catch {
    await prisma.passwordResetToken.delete({ where: { id: tokenId } }).catch(() => {});
  }
}

export async function requestPasswordReset(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = passwordResetRequestSchema.safeParse(Object.fromEntries(formData));
  // Keep this response identical for invalid and unregistered addresses so
  // the form cannot be used to discover customer accounts.
  if (!parsed.success) return { ok: true, message: RESET_REQUEST_MESSAGE };

  try {
    const user = await getPrisma().user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!user || user.role === "admin") {
      return { ok: true, message: RESET_REQUEST_MESSAGE };
    }

    const prisma = getPrisma();
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MS) } },
      select: { id: true },
    });

    if (recentToken) return { ok: true, message: RESET_REQUEST_MESSAGE };

    const token = randomBytes(32).toString("base64url");
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_LIFETIME_MS),
      },
    });

    after(() =>
      sendPasswordResetEmail(resetToken.id, { email: user.email, fullName: user.fullName }, token)
    );
  } catch {
    // Deliberately return the same result. A reset request should never leak
    // whether a customer record exists or whether mail delivery is configured.
  }

  return { ok: true, message: RESET_REQUEST_MESSAGE };
}

export async function resetPassword(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = passwordResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Use a password of at least 8 characters." };
  }

  try {
    const prisma = getPrisma();
    const tokenHash = hashResetToken(parsed.data.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return { ok: false, message: "This reset link is invalid or has expired. Request a new one." };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    try {
      await prisma.$transaction(async (transaction) => {
        const consumed = await transaction.passwordResetToken.updateMany({
          where: { id: resetToken.id, usedAt: null, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() },
        });
        if (consumed.count !== 1) throw new Error("RESET_TOKEN_UNAVAILABLE");

        await transaction.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
        await transaction.passwordResetToken.deleteMany({
          where: { userId: resetToken.userId, id: { not: resetToken.id } },
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "RESET_TOKEN_UNAVAILABLE") {
        return { ok: false, message: "This reset link is invalid or has expired. Request a new one." };
      }
      throw error;
    }
    await createSession(resetToken.userId);
  } catch {
    return { ok: false, message: "We could not reset your password. Please request a new link." };
  }

  redirect("/profile");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
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

    const passwordValid = await verifyPassword(
      password,
      usablePassword ? adminUser.passwordHash : DUMMY_PASSWORD_HASH
    );

    if (!adminUser || adminUser.role !== "admin" || !usablePassword || !passwordValid) {
      return { ok: false, message: "Invalid admin credentials." };
    }

    await createSession(adminUser.id);
  } catch (error) {
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