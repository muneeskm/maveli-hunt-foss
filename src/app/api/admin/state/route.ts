import { NextResponse } from "next/server";
import { buildAdminState, verifyAdmin } from "@/lib/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const code = new URL(req.url).searchParams.get("code") ?? "";
    if (!(await verifyAdmin(code))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await buildAdminState();
    return NextResponse.json({ db });
  } catch (e) {
    console.error("admin/state", e);
    return NextResponse.json({ error: "Could not load admin state." }, { status: 500 });
  }
}
