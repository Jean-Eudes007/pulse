import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeResetToken, getUserByResetToken } from "@/lib/airtable";
import { parseJsonBody } from "@/lib/api-helpers";
import { hashPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/schemas";
import { isExpired } from "@/lib/tokens";

const bodySchema = resetPasswordSchema.extend({
  token: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  const limited = await rateLimit(request, {
    name: "reset-password",
    max: 5,
    window: "10 m",
  });
  if (limited) return limited;

  const parsed = await parseJsonBody(request, bodySchema);
  if (parsed.error) return parsed.error;

  const { token, password } = parsed.data;
  const user = await getUserByResetToken(token);
  if (!user || isExpired(user.resetExpires)) {
    return NextResponse.json(
      { error: "Lien invalide ou expiré" },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  await consumeResetToken(user.id, passwordHash);

  return NextResponse.json({ ok: true });
}
