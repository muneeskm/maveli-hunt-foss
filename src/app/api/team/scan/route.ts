import { NextResponse } from "next/server";
import { recordScanByCode } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string; token?: string };
    const result = await recordScanByCode(body.code ?? "", body.token ?? "");
    return NextResponse.json(result);
  } catch (e) {
    console.error("team/scan", e);
    return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
  }
}
