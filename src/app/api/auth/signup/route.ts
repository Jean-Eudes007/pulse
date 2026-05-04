import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/lib/airtable";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;
  const existing = await getUserByEmail(email);
  if (existing) {
    // I-1: neutral message + 400 to avoid email enumeration via signup
    return NextResponse.json(
      {
        error:
          "Impossible de créer le compte. Si vous avez déjà un compte, essayez de vous connecter.",
      },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, name });

  await setAuthCookie({ id: user.id, email: user.email, role: user.role });
  revalidatePath("/", "layout");

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
