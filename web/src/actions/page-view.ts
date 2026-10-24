"use server";

import { recordStudioPageViewOnce } from "@/lib/data/record-studio-page-view";

export async function recordStudioPageView(params: {
  creatorId: string;
  visitorKey: string;
}): Promise<void> {
  await recordStudioPageViewOnce(params);
}
