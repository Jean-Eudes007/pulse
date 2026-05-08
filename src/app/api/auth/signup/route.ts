import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/airtable";
import { parseJsonBody } from "@/lib/api-helpers";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import {
  getAppUrl,
  sendEmail,
  verificationEmailHtml,
} from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/schemas";
import { generateToken, tokenExpiry } from "@/lib/tokens";

const VERIFICATION_TTL_MINUTES = 24 * 60;

export async function POST(request: Request) {
  const limited = await rateLimit(request, { name: "signup", max: 3, window: "1 m" });
  if (limited) return limited;

  const parsed = await parseJsonBody(request, signupSchema);
  if (parsed.error) return parsed.error;

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
  const verificationToken = generateToken();
  const verificationExpires = tokenExpiry(VERIFICATION_TTL_MINUTES);
  const user = await createUser({
    email,
    passwordHash,
    name,
    verificationToken,
    verificationExpires,
    emailVerifiedAt: new Date().toISOString(),
  });

  const verifyUrl = `${getAppUrl()}/api/auth/verify/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Activez votre compte Pulse",
    html: verificationEmailHtml(verifyUrl),
    devLogContext: `verifyUrl=${verifyUrl}`,
  });

  await setAuthCookie({
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
  });
  revalidatePath("/", "layout");

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
