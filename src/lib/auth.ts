import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { BCRYPT_COST, COOKIE_MAX_AGE_SECONDS, COOKIE_NAME } from "./config";

export type Role = "user" | "dev" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is missing");
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// I-1: a dummy bcrypt hash used to equalize login timing when an email
// doesn't exist. bcrypt.compare against this hash spends the same CPU
// as a real verify, preventing timing-based account enumeration.
// Hash of literal "dummy" with cost 10 — value is deterministic, no
// secret here.
const DUMMY_HASH = bcrypt.hashSync("dummy", BCRYPT_COST);

export async function dummyVerify(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: `${COOKIE_MAX_AGE_SECONDS}s` },
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as {
      sub: string;
      email: string;
      role: Role;
    };
    if (!payload.sub || !payload.email || !payload.role) return null;
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setAuthCookie(user: AuthUser): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, signToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

