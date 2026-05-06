import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/airtable";
import { parseJsonBody } from "@/lib/api-helpers";
import { dummyVerify, setAuthCookie, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const limited = await rateLimit(request, { name: "login", max: 5, window: "1 m" });
  if (limited) return limited;

  const parsed = await parseJsonBody(request, loginSchema);
  if (parsed.error) return parsed.error;

  const { email, password } = parsed.data;
  const user = await getUserByEmail(email);
  if (!user) {
    // I-1: spend equivalent bcrypt time so an attacker can't tell from
    // the response latency whether the email exists. Same 401 either way.
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
