import { NextResponse } from "next/server";
import {
  getUserById,
  setVerificationToken,
} from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";
import {
  getAppUrl,
  sendEmail,
  verificationEmailHtml,
} from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { generateToken, tokenExpiry } from "@/lib/tokens";

const VERIFICATION_TTL_MINUTES = 24 * 60;

// Triggered by the "Resend verification email" button on the
// VerificationBanner. Rate-limited to discourage email-flooding the
// user's inbox.
export async function POST(request: Request) {
  const limited = await rateLimit(request, {
    name: "resend-verification",
    max: 3,
    window: "10 m",
  });
  if (limited) return limited;

  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user: authUser } = auth;

  if (authUser.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  // Pull the fresh row to avoid issuing a new email if a recent token is
  // still valid in the DB but the JWT is stale (edge case after manual
  // Airtable edits).
  const user = await getUserById(authUser.id);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const verificationToken = generateToken();
  const verificationExpires = tokenExpiry(VERIFICATION_TTL_MINUTES);
  await setVerificationToken(user.id, verificationToken, verificationExpires);

  const verifyUrl = `${getAppUrl()}/api/auth/verify/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Activez votre compte Pulse",
    html: verificationEmailHtml(verifyUrl),
    devLogContext: `verifyUrl=${verifyUrl}`,
  });

  return NextResponse.json({ ok: true });
}
