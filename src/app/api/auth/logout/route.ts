import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie();
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
