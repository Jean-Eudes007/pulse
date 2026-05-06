// One-off migration: mark every user that has no EmailVerifiedAt as
// verified at the current timestamp. Idempotent — already-verified
// users are skipped.
// Run with:  node --env-file=.env.local scripts/verify-existing-users.mjs
import Airtable from "airtable";

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token || !baseId) {
  console.error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set.");
  process.exit(1);
}

const base = new Airtable({ apiKey: token }).base(baseId);
const records = await base("Users").select({ pageSize: 100 }).all();

const toUpdate = records.filter((r) => !r.fields.EmailVerifiedAt);
console.log(`Found ${records.length} users, ${toUpdate.length} unverified.\n`);

if (toUpdate.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

const now = new Date().toISOString();
// Airtable .update accepts at most 10 records per call.
for (let i = 0; i < toUpdate.length; i += 10) {
  const batch = toUpdate.slice(i, i + 10).map((r) => ({
    id: r.id,
    fields: { EmailVerifiedAt: now },
  }));
  await base("Users").update(batch);
  console.log(`Updated batch ${i / 10 + 1} (${batch.length} users)`);
}

console.log(`\n✓ Marked ${toUpdate.length} users as verified at ${now}`);
