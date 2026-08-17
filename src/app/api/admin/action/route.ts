import { NextResponse } from "next/server";
import { adminAction, verifyAdmin } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      code?: string;
      action?: string;
      payload?: Record<string, unknown>;
    };
    if (!(await verifyAdmin(body.code ?? ""))) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }
    const result = await adminAction(body.action ?? "", body.payload ?? {});
    return NextResponse.json(result);
  } catch (e) {
    console.error("admin/action", e);
    return NextResponse.json({ ok: false, message: "Action failed." }, { status: 500 });
  }
}
