import { NextResponse } from "next/server";
import { listDevs } from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";

/**
 * Returns the list of dev users (id + name + email).
 * Restricted to admins (used by the assign UI).
 */
export async function GET() {
  const auth = await requireAuth({ role: "admin" });
  if (auth.error) return auth.error;

  const devs = await listDevs();
  return NextResponse.json({
    devs: devs.map((d) => ({ id: d.id, name: d.name, email: d.email })),
  });
}
