"use client";

import { useEffect } from "react";
import { getVisitorKey } from "@/lib/knock/visitor";

export function RecordStudioPageView({ creatorId }: { creatorId: string }) {
  useEffect(() => {
    const key = getVisitorKey();
    if (!key || !creatorId) return;

    const body = JSON.stringify({ creatorId, visitorKey: key });
    const send = () => {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon("/api/studio-view", blob)) return;
      }
      void fetch("/api/studio-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    };

    send();
  }, [creatorId]);

  return null;
}
