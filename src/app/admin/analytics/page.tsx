import { redirect } from "next/navigation";

// /admin/analytics was the standalone analytics route; it has been merged
// into /admin as the default "Vue d'ensemble" tab. Temporary redirect so
// the route can be repurposed later without browsers caching the bounce.
export default function AnalyticsRedirectPage() {
  redirect("/admin");
}
