import { NextResponse } from "next/server";
import { adminLockSeconds, audit, verifyAdmin } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const lock = await adminLockSeconds();
    if (lock > 0) {
      return NextResponse.json(
        { ok: false, message: `Too many failed attempts. Try again in ${lock}s.`, lockSeconds: lock },
        { status: 429 },
      );
    }
    const body = (await req.json()) as { code?: string };
    const ok = await verifyAdmin(body.code ?? "");
    if (!ok) {
      await audit("anonymous", "login:fail", "admin");
      const postLock = await adminLockSeconds();
      const message =
        postLock > 0
          ? `Too many failed attempts. Locked for ${postLock}s.`
          : "Wrong code. This login is logged.";
      return NextResponse.json({ ok: false, message, lockSeconds: postLock }, { status: 401 });
    }
    await audit("admin", "login:success", "admin");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin/login", e);
    return NextResponse.json({ ok: false, message: "Login failed." }, { status: 500 });
  }
}
