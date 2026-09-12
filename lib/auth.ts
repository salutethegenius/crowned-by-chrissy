import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { sessionSecret } from "./env";

export const OWNER_COOKIE = "cbc_owner";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function key() {
  return new TextEncoder().encode(sessionSecret());
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createOwnerSession(ownerId: string) {
  const token = await new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ownerId)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(key());
  const jar = await cookies();
  jar.set(OWNER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearOwnerSession() {
  const jar = await cookies();
  jar.delete(OWNER_COOKIE);
}

export async function readOwnerToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.role !== "owner" || !payload.sub) return null;
    return { ownerId: payload.sub };
  } catch {
    return null;
  }
}

export async function getOwnerSession() {
  const jar = await cookies();
  const parsed = await readOwnerToken(jar.get(OWNER_COOKIE)?.value);
  if (!parsed) return null;
  const owner = await prisma.owner.findUnique({ where: { id: parsed.ownerId } });
  if (!owner) return null;
  return { id: owner.id, email: owner.email, name: owner.name, isDemo: owner.isDemo };
}

export async function requireOwner() {
  const session = await getOwnerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
