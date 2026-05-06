import { NextResponse } from "next/server";
import { getUserById } from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserById(auth.user.id);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
