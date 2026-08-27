"use server";

import { z } from "zod";
import { Resend } from "resend";
import { randomUUID } from "node:crypto";
import { after } from "next/server";

import { createPlaceholderPasswordHash } from "@/app/lib/auth";
import { getPrisma } from "@/app/lib/db";

const enquirySchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),

    email: z
      .string()
      .trim()
      .email()
      .max(180)
      .transform((value) => value.toLowerCase()),

    phone: z.string().trim().max(40).optional().default(""),

    travelStart: z.string().trim().optional().default(""),

    travelEnd: z.string().trim().optional().default(""),

    adults: z.coerce.number().int().min(1).max(50).default(1),

    children: z.coerce.number().int().min(0).max(50).default(0),

    destination: z.string().trim().max(180).optional().default(""),

    message: z.string().trim().max(5000).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.travelStart) {
      const start = new Date(data.travelStart);

      if (Number.isNaN(start.getTime())) {
        ctx.addIssue({
          code: "custom",
          path: ["travelStart"],
          message: "Invalid travel start date",
        });
      }
    }

    if (data.travelEnd) {
      const end = new Date(data.travelEnd);

      if (Number.isNaN(end.getTime())) {
        ctx.addIssue({
          code: "custom",
          path: ["travelEnd"],
          message: "Invalid travel end date",
        });
      }
    }

    if (data.travelStart && data.travelEnd) {
      const start = new Date(data.travelStart);
      const end = new Date(data.travelEnd);

      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end < start
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["travelEnd"],
          message: "Travel end date must be after the start date",
        });
      }
    }
  });

export type EnquiryActionState = {
  ok: boolean;
  message: string;
};

function createEnquiryReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const unique = randomUUID().slice(0, 6).toUpperCase();

  return `TB-${timestamp}-${unique}`;
}

type EmailPayload = {
  reference: string;
  fullName: string;
  email: string;
  phone: string | null;
  destination: string | null;
  travelStart: string | null;
  travelEnd: string | null;
  adults: number;
  children: number;
  message: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character)
  );
}

/*
 * ---------------------------------------------------------
 * ADMIN NOTIFICATION EMAIL (runs AFTER the response is sent)
 * ---------------------------------------------------------
 */
async function sendAdminNotification(notificationId: string, payload: EmailPayload) {
  const prisma = getPrisma();

  const adminEmail = process.env.TRAVEL_BEATS_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_ENQUIRY_FROM_EMAIL;

  if (!adminEmail || !resendApiKey || !fromEmail) {
    return;
  }

  try {
    const resend = new Resend(resendApiKey);

    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      replyTo: payload.email,
      subject: `New Travel Enquiry — ${payload.reference}`,
      text: [
        "NEW TRAVEL ENQUIRY",
        "===================",
        "",
        `Reference: ${payload.reference}`,
        "",
        "CUSTOMER DETAILS",
        "-----------------",
        `Name: ${payload.fullName}`,
        `Email: ${payload.email}`,
        `Phone: ${payload.phone || "Not provided"}`,
        "",
        "TRIP DETAILS",
        "------------",
        `Destination: ${payload.destination || "Not specified"}`,
        `Travel start: ${payload.travelStart || "Flexible"}`,
        `Travel end: ${payload.travelEnd || "Flexible"}`,
        `Adults: ${payload.adults}`,
        `Children: ${payload.children}`,
        "",
        "MESSAGE",
        "-------",
        payload.message || "No message provided",
        "",
        "===================",
        "Submitted from The Travel Beats website.",
      ].join("\n"),
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message || "Resend email delivery failed");
    }

    await prisma.notificationOutbox.update({
      where: { id: notificationId },
      data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
    });
  } catch (error) {
    // The enquiry is already safely stored — only email delivery failed.
    await prisma.notificationOutbox.update({
      where: { id: notificationId },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : "Email delivery failed",
      },
    });
  }
}

/*
 * ---------------------------------------------------------
 * CUSTOMER CONFIRMATION EMAIL (runs AFTER the response is sent)
 * ---------------------------------------------------------
 * This is new — previously only the admin was notified, and the customer
 * had no record of their submission beyond the on-page thank-you message.
 * Independent of the admin notification: it only needs RESEND_API_KEY +
 * RESEND_FROM_EMAIL, not an admin email address, so it still goes out even
 * if admin notification isn't configured.
 */
async function sendCustomerConfirmation(notificationId: string, payload: EmailPayload) {
  const prisma = getPrisma();

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return;
  }

  try {
    const resend = new Resend(resendApiKey);

    const tripLines = [
      payload.destination ? `Destination: ${payload.destination}` : null,
      payload.travelStart || payload.travelEnd
        ? `Dates: ${payload.travelStart || "Flexible"} — ${payload.travelEnd || "Flexible"}`
        : null,
      `Travellers: ${payload.adults} adult${payload.adults === 1 ? "" : "s"}${
        payload.children ? `, ${payload.children} child${payload.children === 1 ? "" : "ren"}` : ""
      }`,
    ].filter(Boolean);

    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: payload.email,
      subject: `We've received your trip request — ${payload.reference}`,
      text: [
        `Hi ${payload.fullName},`,
        "",
        "Thanks for reaching out to The Travel Beats. Your request is with our team and one of our travel experts will be in touch shortly to start shaping your trip.",
        "",
        `Reference: ${payload.reference}`,
        "",
        "WHAT YOU TOLD US",
        "-----------------",
        ...tripLines,
        "",
        "If anything above needs correcting, just reply to this email and let us know.",
        "",
        "— The Travel Beats team",
      ].join("\n"),
      html: [
        `<p>Hi ${escapeHtml(payload.fullName)},</p>`,
        `<p>Thanks for reaching out to The Travel Beats. Your request is with our team and one of our travel experts will be in touch shortly to start shaping your trip.</p>`,
        `<p><strong>Reference:</strong> ${escapeHtml(payload.reference)}</p>`,
        `<p><strong>What you told us:</strong></p>`,
        `<ul>${tripLines.map((line) => `<li>${escapeHtml(line as string)}</li>`).join("")}</ul>`,
        `<p>If anything above needs correcting, just reply to this email and let us know.</p>`,
        `<p>— The Travel Beats team</p>`,
      ].join(""),
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message || "Resend email delivery failed");
    }

    await prisma.notificationOutbox.update({
      where: { id: notificationId },
      data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
    });
  } catch (error) {
    await prisma.notificationOutbox.update({
      where: { id: notificationId },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : "Email delivery failed",
      },
    });
  }
}

export async function createEnquiry(
  _previousState: EnquiryActionState,
  formData: FormData,
): Promise<EnquiryActionState> {
  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check your details and try again.",
    };
  }

  const data = parsed.data;

  try {
    const prisma = getPrisma();

    /*
     * 1 & 2. Find-or-create the customer AND resolve the destination in
     * parallel — neither depends on the other's result.
     */
    const destinationSlug = data.destination
      ? data.destination.toLowerCase().trim().replace(/\s+/g, "-")
      : null;

    const [user, destination] = await Promise.all([
      prisma.user.upsert({
        where: { email: data.email },
        update: {
          fullName: data.fullName,
          phone: data.phone || null,
        },
        create: {
          email: data.email,
          fullName: data.fullName,
          phone: data.phone || null,
          passwordHash: createPlaceholderPasswordHash(),
        },
      }),
      data.destination
        ? prisma.destination.findFirst({
            where: {
              OR: [
                { slug: destinationSlug! },
                { name: { equals: data.destination, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          })
        : Promise.resolve(null as { id: string } | null),
    ]);

    /*
     * 3. Create enquiry in database
     */
    const enquiry = await prisma.enquiry.create({
      data: {
        userId: user.id,
        destinationId: destination?.id ?? null,
        packageId: null,
        reference: createEnquiryReference(),
        source: "website",
        type: destination ? "DESTINATION" : "CUSTOM_TRIP",
        status: "NEW",
        travelStart: data.travelStart ? new Date(data.travelStart) : null,
        travelEnd: data.travelEnd ? new Date(data.travelEnd) : null,
        travellersAdults: data.adults,
        travellersChildren: data.children,
        message: data.message || null,
        contactSnapshot: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
        },
        tripDetails: {
          adults: data.adults,
          children: data.children,
          destination: data.destination || null,
          travelStart: data.travelStart || null,
          travelEnd: data.travelEnd || null,
        },
      },
    });

    /*
     * 4. Create BOTH notification outbox records up front — one per
     * recipient — so each email's delivery status is tracked
     * independently. A failure sending to the customer shouldn't be
     * conflated with (or block) the admin notification, or vice versa.
     */
    const adminEmail = process.env.TRAVEL_BEATS_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const resendConfigured = Boolean(resendApiKey && fromEmail);
    const adminNotifyConfigured = resendConfigured && Boolean(adminEmail);

    const emailPayload: EmailPayload = {
      reference: enquiry.reference,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      destination: data.destination || null,
      travelStart: data.travelStart || null,
      travelEnd: data.travelEnd || null,
      adults: data.adults,
      children: data.children,
      message: data.message || null,
    };

    const [adminNotification, customerNotification] = await Promise.all([
      prisma.notificationOutbox.create({
        data: {
          enquiryId: enquiry.id,
          kind: "NEW_ENQUIRY_EMAIL",
          recipient: adminEmail || "",
          status: adminNotifyConfigured ? "PENDING" : "FAILED",
          lastError: adminNotifyConfigured ? null : "Admin email delivery is not configured.",
          payload: emailPayload,
        },
      }),
      prisma.notificationOutbox.create({
        data: {
          enquiryId: enquiry.id,
          kind: "ENQUIRY_CONFIRMATION_EMAIL",
          recipient: data.email,
          status: resendConfigured ? "PENDING" : "FAILED",
          lastError: resendConfigured ? null : "Email delivery is not configured.",
          payload: emailPayload,
        },
      }),
    ]);

    /*
     * 5. Send both emails AFTER the response goes out. The enquiry + both
     * outbox rows are already durably saved at this point, which is all
     * the user's success message depends on — Resend's API latency for
     * either recipient no longer sits on the critical path of the form
     * submission. Promise.allSettled so one failing doesn't skip the other.
     */
    if (adminNotifyConfigured || resendConfigured) {
      after(async () => {
        await Promise.allSettled([
          adminNotifyConfigured
            ? sendAdminNotification(adminNotification.id, emailPayload)
            : Promise.resolve(),
          resendConfigured
            ? sendCustomerConfirmation(customerNotification.id, emailPayload)
            : Promise.resolve(),
        ]);
      });
    }

    /*
     * 6. Always return success if the enquiry was saved. Even if either
     * email fails, the customer enquiry exists in the DB.
     */
    return {
      ok: true,
      message: "Thanks — your travel request is with our team.",
    };
  } catch (error) {
    console.error("Create enquiry failed:", error);

    return {
      ok: false,
      message: "We could not save your request right now. Please try again shortly.",
    };
  }
}