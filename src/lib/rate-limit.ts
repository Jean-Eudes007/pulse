import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// I-2 audit fix: per-IP rate limiting on bombardable endpoints
// (login / signup / vote). No-op when UPSTASH_REDIS_* env vars aren't set
// — dev and CI run without it, prod gates the limiter on Vercel envs.

type Window = `${number} s` | `${number} m`;

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(name: string, max: number, window: Window): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  let l = limiters.get(name);
  if (!l) {
    l = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: `pulse:rl:${name}`,
      analytics: false,
    });
    limiters.set(name, l);
  }
  return l;
}

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function rateLimit(
  request: Request,
  config: { name: string; max: number; window: Window },
): Promise<NextResponse | null> {
  const limiter = getLimiter(config.name, config.max, config.window);
  if (!limiter) return null;

  const ip = getClientIp(request);
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  if (success) return null;

  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Trop de requêtes, réessayez dans un instant." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
        "Retry-After": String(retryAfter),
      },
    },
  );
}
