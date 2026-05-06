// Central app constants (Q-5 audit refactor).
// Values that are repeated across modules and have a single source of truth.
// Per-feature limits (string lengths, schemas) live next to their schema in lib/schemas.ts.

// --- Auth ---

export const COOKIE_NAME = "pulse_token";

// 7 days. Long enough to avoid daily re-login, short enough to limit
// damage if a cookie is stolen (V3: shorten + add refresh tokens).
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// bcrypt work factor. 10 ≈ 60-100ms on Vercel hobby. Raise to 12 if
// migrating to a beefier runtime (cost doubles per +1).
export const BCRYPT_COST = 10;

// --- Airtable ---

// Default page size for `.all()` and `.firstPage()` calls. 100 is the
// Airtable per-page max; lower values force extra round-trips.
export const AIRTABLE_PAGE_SIZE = 100;
