import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string };
    const ok = await verifyAdmin(body.code ?? "");
    if (!ok) {
      return NextResponse.json({ ok: false, message: "Wrong admin code." }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin/login", e);
    return NextResponse.json({ ok: false, message: "Login failed." }, { status: 500 });
  }
}
