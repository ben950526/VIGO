import { NextResponse } from "next/server";
import { recordStudioPageViewOnce } from "@/lib/data/record-studio-page-view";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { creatorId?: string; visitorKey?: string };
  try {
    body = (await request.json()) as { creatorId?: string; visitorKey?: string };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordStudioPageViewOnce({
    creatorId: String(body.creatorId ?? ""),
    visitorKey: String(body.visitorKey ?? ""),
  });

  return NextResponse.json({ ok: true });
}
