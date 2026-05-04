import { NextResponse } from "next/server";
import { listDevs } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";

/**
 * Returns the list of dev users (id + name + email).
 * Restricted to admins (used by the assign UI).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  const devs = await listDevs();
  return NextResponse.json({
    devs: devs.map((d) => ({ id: d.id, name: d.name, email: d.email })),
  });
}
