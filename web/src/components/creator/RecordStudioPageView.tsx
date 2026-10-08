"use client";

import { useEffect } from "react";
import { recordStudioPageView } from "@/actions/page-view";
import { getVisitorKey } from "@/lib/knock/visitor";

export function RecordStudioPageView({ creatorId }: { creatorId: string }) {
  useEffect(() => {
    const key = getVisitorKey();
    if (!key) return;
    void recordStudioPageView({ creatorId, visitorKey: key });
  }, [creatorId]);

  return null;
}
