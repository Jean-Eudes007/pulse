import { randomBytes } from "node:crypto";

// 32 random bytes → 43-char URL-safe base64. Long enough that an attacker
// can't bruteforce a valid token in any reasonable time.
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function tokenExpiry(durationMinutes: number): string {
  return new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
}

export function isExpired(isoTimestamp: string | null | undefined): boolean {
  if (!isoTimestamp) return true;
  const exp = new Date(isoTimestamp).getTime();
  return Number.isNaN(exp) || exp < Date.now();
}
