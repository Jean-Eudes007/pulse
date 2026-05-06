import { unstable_cache } from "next/cache";
import type { Role } from "../auth";
import { AIRTABLE_PAGE_SIZE } from "../config";
import { type AirtableRecord, nowIso, usersTable } from "./client";

// listDevs is hit on every kanban render to populate the assign dropdown.
// Devs are upgraded manually in Airtable so the list rarely changes —
// 5-minute TTL is plenty fresh for the kanban use case.

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
};

export function mapUser(r: AirtableRecord): UserRecord {
  const f = r.fields as Record<string, unknown>;
  return {
    id: r.id,
    email: String(f.Email ?? ""),
    passwordHash: String(f.PasswordHash ?? ""),
    name: String(f.Name ?? ""),
    role: (f.Role as Role) ?? "user",
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
}): Promise<UserRecord> {
  const created = await usersTable.create([
    {
      fields: {
        Email: input.email,
        PasswordHash: input.passwordHash,
        Name: input.name,
        Role: "user",
        CreatedAt: nowIso(),
      },
    },
  ]);
  return mapUser(created[0]);
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
