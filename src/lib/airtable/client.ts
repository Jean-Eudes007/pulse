import Airtable, { type FieldSet, type Records } from "airtable";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is missing`);
  return v;
}

const airtable = new Airtable({ apiKey: getEnv("AIRTABLE_TOKEN") });
export const base = airtable.base(getEnv("AIRTABLE_BASE_ID"));

export const usersTable = base("Users");
export const feedbacksTable = base("Feedbacks");
export const votesTable = base("Votes");
export const notificationsTable = base("Notifications");
export const commentsTable = base("Comments");

export type AirtableRecord = Records<FieldSet>[number];
export type { FieldSet };

export function nowIso(): string {
  return new Date().toISOString();
}
