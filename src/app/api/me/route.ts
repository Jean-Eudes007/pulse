import { NextResponse } from "next/server";
import { getUserById } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ user: null }, { status: 401 });

  const user = await getUserById(auth.id);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
