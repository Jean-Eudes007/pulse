import { unstable_cache } from "next/cache";
import type { Role } from "../auth";
import { AIRTABLE_PAGE_SIZE } from "../config";
import {
  type AirtableRecord,
  type FieldSet,
  nowIso,
  usersTable,
} from "./client";

// listDevs is hit on every kanban render to populate the assign dropdown.
// Devs are upgraded manually in Airtable so the list rarely changes —
// 5-minute TTL is plenty fresh for the kanban use case.

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  emailVerifiedAt: string | null;
  verificationToken: string | null;
  verificationExpires: string | null;
  resetToken: string | null;
  resetExpires: string | null;
};

function nullableString(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  return String(v);
}

export function mapUser(r: AirtableRecord): UserRecord {
  const f = r.fields as Record<string, unknown>;
  return {
    id: r.id,
    email: String(f.Email ?? ""),
    passwordHash: String(f.PasswordHash ?? ""),
    name: String(f.Name ?? ""),
    role: (f.Role as Role) ?? "user",
    emailVerifiedAt: nullableString(f.EmailVerifiedAt),
    verificationToken: nullableString(f.VerificationToken),
    verificationExpires: nullableString(f.VerificationExpires),
    resetToken: nullableString(f.ResetToken),
    resetExpires: nullableString(f.ResetExpires),
  };
}

export async function getUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const escaped = email.toLowerCase().replace(/'/g, "\\'");
  const records = await usersTable
    .select({
      filterByFormula: `LOWER({Email}) = '${escaped}'`,
      maxRecords: 1,
    })
    .firstPage();
  return records.length ? mapUser(records[0]) : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  try {
    const record = await usersTable.find(id);
    return mapUser(record);
  } catch {
    return null;
  }
}

export async function getUsersByIds(ids: string[]): Promise<UserRecord[]> {
  if (ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const formula = `OR(${unique
    .map((id) => `RECORD_ID() = '${id}'`)
    .join(", ")})`;
  const records = await usersTable
    .select({ filterByFormula: formula, maxRecords: unique.length })
    .all();
  return records.map(mapUser);
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name: string;
  verificationToken: string;
  verificationExpires: string;
}): Promise<UserRecord> {
  const created = await usersTable.create([
    {
      fields: {
        Email: input.email,
        PasswordHash: input.passwordHash,
        Name: input.name,
        Role: "user",
        CreatedAt: nowIso(),
        VerificationToken: input.verificationToken,
        VerificationExpires: input.verificationExpires,
      },
    },
  ]);
  return mapUser(created[0]);
}

// Lookup by verification or reset token. Tokens are 32-byte URL-safe
// base64 strings — collision risk is negligible, no need to scope by
// email.
async function findUserByField(
  field: "VerificationToken" | "ResetToken",
  token: string,
): Promise<UserRecord | null> {
  const escaped = token.replace(/'/g, "\\'");
  const records = await usersTable
    .select({
      filterByFormula: `{${field}} = '${escaped}'`,
      maxRecords: 1,
    })
    .firstPage();
  return records.length ? mapUser(records[0]) : null;
}

export function getUserByVerificationToken(
  token: string,
): Promise<UserRecord | null> {
  return findUserByField("VerificationToken", token);
}

export function getUserByResetToken(token: string): Promise<UserRecord | null> {
  return findUserByField("ResetToken", token);
}

export async function setVerificationToken(
  userId: string,
  token: string,
  expires: string,
): Promise<void> {
  await usersTable.update([
    {
      id: userId,
      fields: {
        VerificationToken: token,
        VerificationExpires: expires,
      },
    },
  ]);
}

export async function markEmailVerified(userId: string): Promise<void> {
  // Airtable accepts null to clear a field but the SDK FieldSet type
  // doesn't include null — same escape hatch as feedbacks.ts.
  await usersTable.update([
    {
      id: userId,
      fields: {
        EmailVerifiedAt: nowIso(),
        VerificationToken: null,
        VerificationExpires: null,
      } as unknown as Partial<FieldSet>,
    },
  ]);
}

export async function setResetToken(
  userId: string,
  token: string,
  expires: string,
): Promise<void> {
  await usersTable.update([
    {
      id: userId,
      fields: {
        ResetToken: token,
        ResetExpires: expires,
      },
    },
  ]);
}

export async function consumeResetToken(
  userId: string,
  newPasswordHash: string,
): Promise<void> {
  await usersTable.update([
    {
      id: userId,
      fields: {
        PasswordHash: newPasswordHash,
        ResetToken: null,
        ResetExpires: null,
      } as unknown as Partial<FieldSet>,
    },
  ]);
}

export const listDevs = unstable_cache(
  async function listDevs(): Promise<UserRecord[]> {
    const records = await usersTable
      .select({
        filterByFormula: `{Role} = 'dev'`,
        pageSize: AIRTABLE_PAGE_SIZE,
      })
      .all();
    return records.map(mapUser);
  },
  ["devs-list"],
  { tags: ["devs"], revalidate: 300 },
);
