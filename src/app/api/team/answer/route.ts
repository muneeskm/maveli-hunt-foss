import { NextResponse } from "next/server";
import { submitAnswerByCode } from "@/lib/server";
import type { AnswerKind } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      code?: string;
      kind?: AnswerKind;
      locationId?: string;
      value?: string;
      words?: string[];
    };
    const kind = body.kind;
    if (kind !== "spotdiff" && kind !== "bitchat" && kind !== "reconstruction") {
      return NextResponse.json({ ok: false, message: "Unsupported answer kind." }, { status: 400 });
    }
    const result = await submitAnswerByCode(body.code ?? "", kind, {
      locationId: body.locationId,
      value: body.value,
      words: body.words,
    });
    if (result.ok && !result.correct && result.lockSeconds && result.lockSeconds > 0) {
      // mirror the client UI expectation: locked attempts are failures
      return NextResponse.json({ ok: false, message: `Locked for ${result.lockSeconds}s`, lockSeconds: result.lockSeconds });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("team/answer", e);
    return NextResponse.json({ ok: false, message: "Could not verify. Try again." }, { status: 500 });
  }
}
