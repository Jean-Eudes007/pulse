import { NextResponse } from "next/server";
import { getUserByEmail, setResetToken } from "@/lib/airtable";
import { parseJsonBody } from "@/lib/api-helpers";
import {
  getAppUrl,
  resetPasswordEmailHtml,
  sendEmail,
} from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/schemas";
import { generateToken, tokenExpiry } from "@/lib/tokens";

const RESET_TTL_MINUTES = 60;

// Always returns the same neutral 200 response, regardless of whether
// the email exists, to avoid leaking which addresses are registered
// (same playbook as the login I-1 timing fix).
export async function POST(request: Request) {
  const limited = await rateLimit(request, {
    name: "forgot-password",
    max: 5,
    window: "10 m",
  });
  if (limited) return limited;

  const parsed = await parseJsonBody(request, forgotPasswordSchema);
  if (parsed.error) return parsed.error;

  const { email } = parsed.data;
  const user = await getUserByEmail(email);

  if (user) {
    const resetToken = generateToken();
    const resetExpires = tokenExpiry(RESET_TTL_MINUTES);
    await setResetToken(user.id, resetToken, resetExpires);

    const resetUrl = `${getAppUrl()}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe Pulse",
      html: resetPasswordEmailHtml(resetUrl),
      devLogContext: `resetUrl=${resetUrl}`,
    });
  }

  return NextResponse.json({ ok: true });
}
