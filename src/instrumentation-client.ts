import * as Sentry from "@sentry/nextjs";

// Sentry browser init. Only runs if NEXT_PUBLIC_SENTRY_DSN is set.
// This makes Sentry opt-in: locally and in CI it's a no-op.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
