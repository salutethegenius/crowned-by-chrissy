import { NextResponse } from "next/server";
import { cronSecret } from "@/lib/env";
import { runScheduledJobs } from "@/lib/jobs";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!cronSecret() || auth !== `Bearer ${cronSecret()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await runScheduledJobs();
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  return POST(request);
}
