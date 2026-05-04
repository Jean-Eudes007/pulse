"use client";

import { useEffect, useRef } from "react";

/**
 * Fires DELETE /api/notifications?feedbackId=... once on mount.
 * Used on the feedback detail page so the creator's notification for
 * that feedback gets cleared as soon as they read it.
 */
export function MarkSeenOnMount({ feedbackId }: { feedbackId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(
      `/api/notifications?feedbackId=${encodeURIComponent(feedbackId)}`,
      { method: "DELETE" },
    ).catch(() => {
      // silent — failure to mark seen is harmless, banner will retry next visit
    });
  }, [feedbackId]);

  return null;
}
