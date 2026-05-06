// One-off migration: add the 5 email-verification + password-reset
// fields to the Users table in Airtable, then mark every existing user
// as verified.
//
// Requires the PAT to have BOTH scopes:
//   - data.records:read+write
//   - schema.bases:write
//
// Run with:  node --env-file=.env.local scripts/add-verification-fields.mjs

import Airtable from "airtable";

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token || !baseId) {
  console.error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set.");
  process.exit(1);
}

const FIELDS = [
  {
    name: "EmailVerifiedAt",
    type: "dateTime",
    options: {
      dateFormat: { name: "iso" },
      timeFormat: { name: "24hour" },
      timeZone: "utc",
    },
  },
  { name: "VerificationToken", type: "singleLineText" },
  {
    name: "VerificationExpires",
    type: "dateTime",
    options: {
      dateFormat: { name: "iso" },
      timeFormat: { name: "24hour" },
      timeZone: "utc",
    },
  },
  { name: "ResetToken", type: "singleLineText" },
  {
    name: "ResetExpires",
    type: "dateTime",
    options: {
      dateFormat: { name: "iso" },
      timeFormat: { name: "24hour" },
      timeZone: "utc",
    },
  },
];

async function api(path, init = {}) {
  const res = await fetch(`https://api.airtable.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}\n${body}`);
  }
  return res.json();
}

console.log("→ Fetching schema…");
const meta = await api(`/v0/meta/bases/${baseId}/tables`);
const usersTable = meta.tables.find((t) => t.name === "Users");
if (!usersTable) {
  console.error("Could not find a 'Users' table in the base.");
  process.exit(1);
}
console.log(`  Users table id = ${usersTable.id}`);
const existing = new Set(usersTable.fields.map((f) => f.name));

console.log("\n→ Creating missing fields…");
for (const field of FIELDS) {
  if (existing.has(field.name)) {
    console.log(`  ✓ ${field.name} (already exists, skipping)`);
    continue;
  }
  await api(
    `/v0/meta/bases/${baseId}/tables/${usersTable.id}/fields`,
    { method: "POST", body: JSON.stringify(field) },
  );
  console.log(`  + ${field.name} created`);
}

console.log("\n→ Marking unverified users as verified…");
const base = new Airtable({ apiKey: token }).base(baseId);
const records = await base("Users").select({ pageSize: 100 }).all();
const toUpdate = records.filter((r) => !r.fields.EmailVerifiedAt);
console.log(`  ${records.length} users total, ${toUpdate.length} unverified.`);

if (toUpdate.length === 0) {
  console.log("\nDone — nothing to update.");
  process.exit(0);
}

const now = new Date().toISOString();
for (let i = 0; i < toUpdate.length; i += 10) {
  const batch = toUpdate.slice(i, i + 10).map((r) => ({
    id: r.id,
    fields: { EmailVerifiedAt: now },
  }));
  await base("Users").update(batch);
  console.log(`  Updated batch ${i / 10 + 1} (${batch.length} users)`);
}

console.log(`\n✓ Done. ${toUpdate.length} users marked verified at ${now}`);
