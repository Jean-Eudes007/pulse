import { NextResponse } from "next/server";
import { z } from "zod";
import { type AuthUser, type Role, getCurrentUser } from "./auth";

type RoleConstraint = Role | readonly Role[];

function roleAllowed(userRole: Role, expected: RoleConstraint): boolean {
  if (Array.isArray(expected)) return expected.includes(userRole);
  return userRole === expected;
}

/**
 * Auth + optional role gate for API routes.
 *
 * Usage:
 *   const auth = await requireAuth();              // any authenticated user
 *   const auth = await requireAuth({ role: "admin" });
 *   const auth = await requireAuth({ role: ["admin", "dev"] });
 *   const auth = await requireAuth({ verified: true }); // also require verified email
 *   if (auth.error) return auth.error;
 *   const { user } = auth;
 */
export async function requireAuth(
  opts: { role?: RoleConstraint; verified?: boolean } = {},
): Promise<
  | { user: AuthUser; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }
  if (opts.role && !roleAllowed(user.role, opts.role)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Action refusée" }, { status: 403 }),
    };
  }
  // Optional email-verification gate. Active only when REQUIRE_EMAIL_VERIFICATION
  // is set, so legacy users (created before the field existed) and dev/CI
  // setups without Resend keep working out of the box.
  if (
    opts.verified &&
    process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
    !user.emailVerifiedAt
  ) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Email non vérifié. Vérifiez votre boîte mail." },
        { status: 403 },
      ),
    };
  }
  return { user, error: null };
}

/**
 * Build a single human-readable error string from a ZodError so the
 * client can display the real reason ("Description min. 10 caractères")
 * instead of a generic "Validation failed". Schemas in lib/schemas.ts
 * already define explicit French messages, so we just join the unique
 * issue messages here.
 */
function formatZodIssues(error: z.ZodError): string {
  const seen = new Set<string>();
  const messages: string[] = [];
  for (const issue of error.issues) {
    if (issue.message && !seen.has(issue.message)) {
      seen.add(issue.message);
      messages.push(issue.message);
    }
  }
  return messages.length > 0 ? messages.join(" · ") : "Validation failed";
}

/**
 * Parse + validate a request JSON body against a Zod schema.
 *
 * Usage:
 *   const parsed = await parseJsonBody(request, mySchema);
 *   if (parsed.error) return parsed.error;
 *   const { data } = parsed;
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: formatZodIssues(result.error),
          details: z.treeifyError(result.error),
        },
        { status: 400 },
      ),
    };
  }
  return { data: result.data, error: null };
}
