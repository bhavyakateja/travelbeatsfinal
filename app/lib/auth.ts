import "server-only";

import { cookies } from "next/headers";
import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getPrisma } from "./db";

const scrypt = promisify(nodeScrypt);
const cookieName = "travel_beats_session";
const sessionLifetime = 60 * 60 * 24 * 30;

function sessionSecret() {
    return process.env.AUTH_SECRET || process.env.DATABASE_URL || "travel-beats-development-secret";
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

export async function getCurrentUser() {
    const raw = (await cookies()).get(cookieName)?.value;
    if (!raw) return null;
    const [userId, expiresAt, signature] = raw.split(".");
    const value = `${userId}.${expiresAt}`;
    if (!userId || !expiresAt || !signature || Number(expiresAt) < Date.now() / 1000 || sign(value) !== signature) {
        return null;
    }
    return getPrisma().user.findUnique({ where: { id: userId } });
}
