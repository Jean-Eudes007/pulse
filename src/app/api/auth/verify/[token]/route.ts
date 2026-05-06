import { NextResponse } from "next/server";
import {
  getUserByVerificationToken,
  markEmailVerified,
} from "@/lib/airtable";
import { getCurrentUser, setAuthCookie } from "@/lib/auth";
import { getAppUrl } from "@/lib/email";
import { isExpired } from "@/lib/tokens";

type RouteContext = {
  params: Promise<{ token: string }>;
};

// GET handler so a click on the link from the verification email works
// in a single request — verifies, re-issues the auth cookie if the same
// user is logged in, and redirects to a static result page. Server
// Components can't write cookies during render, so this lives here
// rather than in a /verify/[token]/page.tsx.
export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const appUrl = getAppUrl();
  const done = (status: "ok" | "not_found" | "expired") =>
    NextResponse.redirect(`${appUrl}/verify/done?status=${status}`);

  const user = await getUserByVerificationToken(token);
  if (!user) return done("not_found");

  if (user.emailVerifiedAt) {
    // Token still in DB but user already marked verified — treat as success.
    return done("ok");
  }

  if (isExpired(user.verificationExpires)) return done("expired");

  await markEmailVerified(user.id);

  // Re-issue the JWT for the currently logged-in browser so the verified
  // flag updates without forcing a re-login. If a different user (or no
  // user) clicks the link, leave the existing cookie alone.
  const me = await getCurrentUser();
  if (me?.id === user.id) {
    await setAuthCookie({
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerifiedAt: new Date().toISOString(),
    });
  }

  return done("ok");
}
