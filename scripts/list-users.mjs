// One-off script: list all users + verification status. Read-only.
// Run with:  node --env-file=.env.local scripts/list-users.mjs
import Airtable from "airtable";

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token || !baseId) {
  console.error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set.");
  process.exit(1);
}

const base = new Airtable({ apiKey: token }).base(baseId);
const records = await base("Users").select({ pageSize: 100 }).all();

console.log(`Total users: ${records.length}\n`);
console.log("ID                          Email                              Role     Verified");
console.log("--------------------------- ---------------------------------- -------- --------");
for (const r of records) {
  const f = r.fields;
  const id = r.id.padEnd(27);
  const email = String(f.Email ?? "").padEnd(34);
  const role = String(f.Role ?? "user").padEnd(8);
  const verified = f.EmailVerifiedAt ? "✓" : "✗";
  console.log(`${id} ${email} ${role} ${verified}`);
}
