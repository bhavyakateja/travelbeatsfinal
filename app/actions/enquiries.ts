"use server";

import { z } from "zod";
import { Resend } from "resend";
import { randomUUID } from "node:crypto";

import { hashPassword } from "@/app/lib/auth";
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
     * ---------------------------------------------------------
     * 1. Find or create the customer
     * ---------------------------------------------------------
     */

    const user = await prisma.user.upsert({
      where: {
        email: data.email,
      },

      update: {
        fullName: data.fullName,
        phone: data.phone || null,
      },

      create: {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || null,

        // Random password because this user is being created
        // from an enquiry rather than a normal signup flow.
        passwordHash: await hashPassword(randomUUID()),
      },
    });

    /*
     * ---------------------------------------------------------
     * 2. Resolve destination if supplied
     * ---------------------------------------------------------
     */

    let destination: { id: string } | null = null;

    if (data.destination) {
      const slug = data.destination
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

      destination = await prisma.destination.findFirst({
        where: {
          OR: [
            {
              slug,
            },
            {
              name: {
                equals: data.destination,
                mode: "insensitive",
              },
            },
          ],
        },

        select: {
          id: true,
        },
      });
    }

    /*
     * ---------------------------------------------------------
     * 3. Create enquiry in database
     * ---------------------------------------------------------
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

        travelStart: data.travelStart
          ? new Date(data.travelStart)
          : null,

        travelEnd: data.travelEnd
          ? new Date(data.travelEnd)
          : null,

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
     * ---------------------------------------------------------
     * 4. Email configuration
     * ---------------------------------------------------------
     */

    const adminEmail =
      process.env.TRAVEL_BEATS_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL;

    const resendApiKey = process.env.RESEND_API_KEY;

    const fromEmail = process.env.RESEND_FROM_EMAIL;

    const emailConfigured = Boolean(
      adminEmail &&
        resendApiKey &&
        fromEmail,
    );

    /*
     * ---------------------------------------------------------
     * 5. Create notification outbox record
     * ---------------------------------------------------------
     */

    const notification =
      await prisma.notificationOutbox.create({
        data: {
          enquiryId: enquiry.id,

          kind: "NEW_ENQUIRY_EMAIL",

          recipient: adminEmail || "",

          status: emailConfigured
            ? "PENDING"
            : "FAILED",

          lastError: emailConfigured
            ? null
            : "Email delivery is not configured.",

          payload: {
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
          },
        },
      });

    /*
     * ---------------------------------------------------------
     * 6. Send email to admin
     * ---------------------------------------------------------
     */

    if (
      emailConfigured &&
      adminEmail &&
      resendApiKey &&
      fromEmail
    ) {
      try {
        const resend = new Resend(resendApiKey);

        const emailResult = await resend.emails.send({
          from: fromEmail,

          to: adminEmail,

          replyTo: data.email,

          subject: `New Travel Enquiry — ${enquiry.reference}`,

          text: [
            "NEW TRAVEL ENQUIRY",
            "===================",
            "",
            `Reference: ${enquiry.reference}`,
            "",
            "CUSTOMER DETAILS",
            "-----------------",
            `Name: ${data.fullName}`,
            `Email: ${data.email}`,
            `Phone: ${data.phone || "Not provided"}`,
            "",
            "TRIP DETAILS",
            "------------",
            `Destination: ${
              data.destination || "Not specified"
            }`,
            `Travel start: ${
              data.travelStart || "Flexible"
            }`,
            `Travel end: ${
              data.travelEnd || "Flexible"
            }`,
            `Adults: ${data.adults}`,
            `Children: ${data.children}`,
            "",
            "MESSAGE",
            "-------",
            data.message || "No message provided",
            "",
            "===================",
            "Submitted from The Travel Beats website.",
          ].join("\n"),
        });

        /*
         * Resend can return an error without throwing.
         */
        if (emailResult.error) {
          throw new Error(
            emailResult.error.message ||
              "Resend email delivery failed",
          );
        }

        /*
         * Mark notification as successfully sent.
         */
        await prisma.notificationOutbox.update({
          where: {
            id: notification.id,
          },

          data: {
            status: "SENT",

            sentAt: new Date(),

            attempts: {
              increment: 1,
            },

            lastError: null,
          },
        });
      } catch (error) {
        /*
         * The enquiry is already safely stored.
         *
         * Only email delivery failed.
         */
        await prisma.notificationOutbox.update({
          where: {
            id: notification.id,
          },

          data: {
            status: "FAILED",

            attempts: {
              increment: 1,
            },

            lastError:
              error instanceof Error
                ? error.message
                : "Email delivery failed",
          },
        });
      }
    }

    /*
     * ---------------------------------------------------------
     * 7. Always return success if enquiry was saved
     * ---------------------------------------------------------
     *
     * Even if email fails, the customer enquiry exists
     * in the database.
     */

    return {
      ok: true,
      message:
        "Thanks — your travel request is with our team.",
    };
  } catch (error) {
    console.error("Create enquiry failed:", error);

    return {
      ok: false,
      message:
        "We could not save your request right now. Please try again shortly.",
    };
  }
}