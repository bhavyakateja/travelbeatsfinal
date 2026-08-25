import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import {
    createHmac,
    randomBytes,
    randomUUID,
    scrypt as nodeScrypt,
    timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { getPrisma } from "./db";

const scrypt = promisify(nodeScrypt);
const cookieName = "travel_beats_session";
const sessionLifetime = 60 * 60 * 24 * 30;

function sessionSecret() {
    const secret = process.env.AUTH_SECRET;

    // A missing AUTH_SECRET used to silently fall back to DATABASE_URL, or
    // to a hardcoded string checked into source control, as the HMAC key
    // signing every session cookie. In production that's a real
    // authentication bypass risk, not just a missing niceity — anyone who
    // reads this file (or the DB connection string) could forge a valid
    // session cookie for any user id. Fail loudly instead.
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "AUTH_SECRET is not configured. Refusing to sign session cookies with a fallback secret in production."
            );
        }
        return process.env.DATABASE_URL || "travel-beats-development-secret";
    }

    return secret;
}

export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(key, "hex");
    return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

// Enquiry submissions (actions/enquiry.ts) create a user record for the
// customer before they've ever chosen a password. That row still needs
// *some* value in passwordHash, but it must never be usable to log in, and
// it must be distinguishable later from a hash that came from a real
// hashPassword() call — otherwise signUp() has no way to tell "this email
// already has a real account" apart from "this email only exists because
// someone filled out an enquiry form".
//
// hashPassword() output is always `<32 hex chars>:<128 hex chars>`. This
// sentinel uses a prefix that can never collide with that shape, so it's
// unambiguous to detect.
const PLACEHOLDER_PASSWORD_PREFIX = "unset:";

export function createPlaceholderPasswordHash() {
    return `${PLACEHOLDER_PASSWORD_PREFIX}${randomUUID()}`;
}

export function hasUsablePassword(
    passwordHash: string | null | undefined
): passwordHash is string {
    return Boolean(passwordHash) && !passwordHash!.startsWith(PLACEHOLDER_PASSWORD_PREFIX);
}

function sign(value: string) {
    return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export async function createSession(userId: string) {
    const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetime;
    const value = `${userId}.${expiresAt}`;
    (await cookies()).set(cookieName, `${value}.${sign(value)}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: sessionLifetime,
    });
}

export async function clearSession() {
    (await cookies()).delete(cookieName);
}

// Wrapped in React's cache() — this is per-request memoization (distinct
// from Next's Data Cache / unstable_cache), so it's unaffected by whether
// Cache Components is enabled. Multiple components rendered during the
// same request (layout + page, or several Suspense-wrapped children, as
// on the destinations page) now share one DB lookup instead of each
// triggering their own. The signed-cookie verification stays outside any
// cross-request cache, since it must always reflect the current request.
export const getCurrentUser = cache(async () => {
    const raw = (await cookies()).get(cookieName)?.value;
    if (!raw) return null;

    const [userId, expiresAt, signature] = raw.split(".");
    const value = `${userId}.${expiresAt}`;

    if (!userId || !expiresAt || !signature || Number(expiresAt) < Date.now() / 1000 || sign(value) !== signature) {
        return null;
    }

    return getPrisma().user.findUnique({
        where: { id: userId },
        // `omit` (rather than `select`) so this stays correct if the User
        // model grows new fields later — we don't need to remember to add
        // them to an allow-list. The one field that should never leave
        // this function is the password hash.
        omit: { passwordHash: true },
    });
});