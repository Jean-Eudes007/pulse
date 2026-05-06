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
 *   if (auth.error) return auth.error;
 *   const { user } = auth;
 */
export async function requireAuth(opts: { role?: RoleConstraint } = {}): Promise<
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
  return { user, error: null };
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
        { error: "Validation failed", details: z.treeifyError(result.error) },
        { status: 400 },
      ),
    };
  }
  return { data: result.data, error: null };
}
