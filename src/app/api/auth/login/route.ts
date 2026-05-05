import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/airtable";
import { dummyVerify, setAuthCookie, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await getUserByEmail(email);
  if (!user) {
    // Spend equivalent bcrypt time so an attacker can't tell from the
    // response latency whether the email exists. Same 401 message either way.
    await dummyVerify(password);
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 },
    );
  }

  await setAuthCookie({ id: user.id, email: user.email, role: user.role });
  revalidatePath("/", "layout");

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
