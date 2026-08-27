"use server";

import { z } from "zod";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { Resend } from "resend";

import {
  clearSession,
  createSession,
  hashPassword,
  hasUsablePassword,
  verifyPassword,
} from "../lib/auth";
import { getPrisma } from "../lib/db";

export type AuthActionState = {
  ok: boolean;
  message: string;
} | null;

const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(1).max(128),
});

const passwordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((values) => values.password === values.confirmPassword, {
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

const RESET_REQUEST_MESSAGE =
  "If an account exists for that email, we have sent a password reset link.";

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  // Safe local-development fallback.
  // In production, NEXT_PUBLIC_SITE_URL should always be configured.
  const siteUrl = configuredUrl || "http://localhost:3000";

  try {
    const url = new URL(siteUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
    }

    return url.origin;
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SITE_URL. Example: https://thetravelbeats.com"
    );
  }
}

function passwordResetUrl(token: string) {
  const url = new URL("/auth/reset-password", getSiteUrl());

  url.searchParams.set("token", token);

  return url.toString();
}

/*
 * A fixed, non-secret scrypt hash used as the comparison target when
 * there is no usable password to check against.
 *
 * This keeps password verification work consistent and helps prevent
 * account enumeration through timing differences.
 */
const DUMMY_PASSWORD_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;

function timingSafeStringEqual(a: string, b: string) {
  const aHash = createHash("sha256").update(a).digest();
  const bHash = createHash("sha256").update(b).digest();

  return timingSafeEqual(aHash, bHash);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character] ?? character;
  });
}

/* -------------------------------------------------------------------------- */
/* SIGN UP                                                                    */
/* -------------------------------------------------------------------------- */

export async function signUp(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Use a name, valid email, and password of 8+ characters.",
    };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const prisma = getPrisma();

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (hasUsablePassword(existing?.passwordHash)) {
      return {
        ok: false,
        message: "An account already exists for this email.",
      };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            fullName: parsed.data.fullName,
            passwordHash,
          },
        })
      : await prisma.user.create({
          data: {
            fullName: parsed.data.fullName,
            email,
            passwordHash,
          },
        });

    await createSession(user.id);
  } catch {
    return {
      ok: false,
      message: "We could not create your account right now.",
    };
  }

  redirect("/");
}

/* -------------------------------------------------------------------------- */
/* LOGIN                                                                      */
/* -------------------------------------------------------------------------- */

export async function logIn(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid email and password.",
    };
  }

  try {
    const email = parsed.data.email.toLowerCase();

    const user = await getPrisma().user.findUnique({
      where: { email },
    });

    if (user?.role === "admin") {
      return {
        ok: false,
        message: "Use the admin login page to access the dashboard.",
      };
    }

    const usablePassword = hasUsablePassword(user?.passwordHash);

    const passwordValid = await verifyPassword(
      parsed.data.password,
      usablePassword ? user.passwordHash : DUMMY_PASSWORD_HASH
    );

    if (!usablePassword || !passwordValid) {
      return {
        ok: false,
        message: "Email or password is incorrect.",
      };
    }

    await createSession(user!.id);
  } catch {
    return {
      ok: false,
      message: "We could not sign you in right now.",
    };
  }

  redirect("/");
}

/* -------------------------------------------------------------------------- */
/* PASSWORD RESET EMAIL                                                       */
/* -------------------------------------------------------------------------- */

async function sendPasswordResetEmail(
  tokenId: string,
  user: {
    email: string;
    fullName: string;
  },
  token: string
) {
  const prisma = getPrisma();

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  const resetUrl = passwordResetUrl(token);

  const resend = new Resend(resendApiKey);

  const { data, error } = await resend.emails.send(
    {
      from: fromEmail,
      to: [user.email],
      subject: "Reset your Travel Beats password",
      html: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Reset your Travel Beats password</title>
          </head>

          <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:#ffffff;border-radius:12px;padding:32px;">
                <h1 style="margin:0 0 20px;font-size:24px;">
                  Reset your password
                </h1>

                <p style="margin:0 0 16px;line-height:1.6;">
                  Hello ${escapeHtml(user.fullName)},
                </p>

                <p style="margin:0 0 24px;line-height:1.6;">
                  We received a request to reset your Travel Beats password.
                  Click the button below to choose a new password.
                </p>

                <p style="margin:0 0 24px;">
                  <a
                    href="${resetUrl}"
                    style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;"
                  >
                    Reset my password
                  </a>
                </p>

                <p style="margin:0 0 12px;line-height:1.6;font-size:14px;color:#6b7280;">
                  This link expires in 30 minutes.
                </p>

                <p style="margin:0;line-height:1.6;font-size:14px;color:#6b7280;">
                  If you did not request this password reset, you can safely
                  ignore this email.
                </p>
              </div>

              <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#9ca3af;">
                Travel Beats
              </p>
            </div>
          </body>
        </html>
      `,
    },
    {
      // Prevent accidental duplicate sends if the request is retried.
      idempotencyKey: `password-reset/${tokenId}`,
    }
  );

  if (error) {
    throw new Error(error.message || "Resend failed to send the email.");
  }

  if (!data?.id) {
    throw new Error("Resend did not return an email ID.");
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* REQUEST PASSWORD RESET                                                     */
/* -------------------------------------------------------------------------- */

export async function requestPasswordReset(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = passwordResetRequestSchema.safeParse(
    Object.fromEntries(formData)
  );

  /*
   * Always return the same message for invalid/unregistered addresses.
   * This prevents account enumeration.
   */
  if (!parsed.success) {
    return {
      ok: true,
      message: RESET_REQUEST_MESSAGE,
    };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    /*
     * Do not allow customer password reset to operate on admin accounts.
     */
    if (!user || user.role === "admin") {
      return {
        ok: true,
        message: RESET_REQUEST_MESSAGE,
      };
    }

    /*
     * Prevent repeated reset-email requests within the cooldown window.
     */
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gt: new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MS),
        },
      },
      select: {
        id: true,
      },
    });

    if (recentToken) {
      return {
        ok: true,
        message: RESET_REQUEST_MESSAGE,
      };
    }

    /*
     * Generate a cryptographically secure random token.
     *
     * Only the SHA-256 hash is stored in the database.
     * The raw token exists only inside the email URL.
     */
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashResetToken(token);

    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_LIFETIME_MS),
      },
    });

    try {
      /*
       * IMPORTANT:
       * Send the email directly instead of using after().
       *
       * Password reset is security-critical and the email must actually
       * be handed to Resend before this action completes.
       */
      const emailResult = await sendPasswordResetEmail(
        resetToken.id,
        {
          email: user.email,
          fullName: user.fullName,
        },
        token
      );

      /*
       * Log only the Resend message ID.
       * Do not log the reset token or password.
       */
      console.info(
        `[password-reset] Reset email accepted by Resend: ${emailResult.id}`
      );
    } catch (error) {
      /*
       * The token must not remain usable if we could not send the email.
       */
      await prisma.passwordResetToken
        .delete({
          where: { id: resetToken.id },
        })
        .catch(() => {});

      /*
       * Log the server-side failure for debugging/production monitoring.
       * The user still receives the generic response below.
       */
      console.error(
        "[password-reset] Failed to send reset email:",
        error instanceof Error ? error.message : error
      );
    }
  } catch (error) {
    /*
     * Never expose database, Resend, or account-existence information
     * to the client.
     */
    console.error(
      "[password-reset] Request failed:",
      error instanceof Error ? error.message : error
    );
  }

  return {
    ok: true,
    message: RESET_REQUEST_MESSAGE,
  };
}

/* -------------------------------------------------------------------------- */
/* RESET PASSWORD                                                             */
/* -------------------------------------------------------------------------- */

export async function resetPassword(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = passwordResetSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ||
        "Use a password of at least 8 characters.",
    };
  }

  try {
    const prisma = getPrisma();

    const tokenHash = hashResetToken(parsed.data.token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      return {
        ok: false,
        message:
          "This reset link is invalid or has expired. Request a new one.",
      };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    try {
      await prisma.$transaction(async (transaction) => {
        /*
         * Atomically consume the token.
         *
         * This prevents two concurrent requests from using the same
         * password-reset token successfully.
         */
        const consumed =
          await transaction.passwordResetToken.updateMany({
            where: {
              id: resetToken.id,
              usedAt: null,
              expiresAt: {
                gt: new Date(),
              },
            },
            data: {
              usedAt: new Date(),
            },
          });

        if (consumed.count !== 1) {
          throw new Error("RESET_TOKEN_UNAVAILABLE");
        }

        await transaction.user.update({
          where: {
            id: resetToken.userId,
          },
          data: {
            passwordHash,
          },
        });

        /*
         * Invalidate all other reset tokens belonging to this user.
         */
        await transaction.passwordResetToken.deleteMany({
          where: {
            userId: resetToken.userId,
            id: {
              not: resetToken.id,
            },
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "RESET_TOKEN_UNAVAILABLE"
      ) {
        return {
          ok: false,
          message:
            "This reset link is invalid or has expired. Request a new one.",
        };
      }

      throw error;
    }

    /*
     * Automatically sign the user in after successfully changing
     * their password.
     */
    await createSession(resetToken.userId);
  } catch (error) {
    console.error(
      "[password-reset] Password update failed:",
      error instanceof Error ? error.message : error
    );

    return {
      ok: false,
      message:
        "We could not reset your password. Please request a new link.",
    };
  }

  redirect("/profile");
}

/* -------------------------------------------------------------------------- */
/* ADMIN LOGIN                                                                */
/* -------------------------------------------------------------------------- */

export async function adminLogIn(
  _previous: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid admin email and password.",
    };
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
        where: {
          email,
        },
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

    const adminUser = await prisma.user.findUnique({
      where: { email },
    });

    const usablePassword = hasUsablePassword(
      adminUser?.passwordHash
    );

    const passwordValid = await verifyPassword(
      password,
      usablePassword
        ? adminUser.passwordHash
        : DUMMY_PASSWORD_HASH
    );

    if (
      !adminUser ||
      adminUser.role !== "admin" ||
      !usablePassword ||
      !passwordValid
    ) {
      return {
        ok: false,
        message: "Invalid admin credentials.",
      };
    }

    await createSession(adminUser.id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error(
      "[admin-login] Login failed:",
      error instanceof Error ? error.message : error
    );

    return {
      ok: false,
      message:
        "We could not sign you into the admin dashboard.",
    };
  }

  redirect("/admin");
}

/* -------------------------------------------------------------------------- */
/* LOGOUT                                                                     */
/* -------------------------------------------------------------------------- */

export async function logOut() {
  await clearSession();

  redirect("/");
}