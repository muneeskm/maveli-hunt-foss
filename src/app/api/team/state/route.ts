import { NextResponse } from "next/server";
import { buildTeamState } from "@/lib/server";

export const runtime = "nodejs";

/*
 * The single polling endpoint powering the whole team experience: phase,
 * leaderboard, broadcasts, the team's own progress, and the words the team
 * has earned. Clients poll this every ~4s (see lib/http-store.ts).
 * It never returns unearned answers.
 */
export async function GET(req: Request) {
  try {
    const code = new URL(req.url).searchParams.get("code") ?? "";
    const state = await buildTeamState(code);
    return NextResponse.json({ state });
  } catch (e) {
    console.error("team/state", e);
    return NextResponse.json({ error: "Could not load state." }, { status: 500 });
  }
}
