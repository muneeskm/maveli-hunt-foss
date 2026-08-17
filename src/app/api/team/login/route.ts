import { NextResponse } from "next/server";
import { getTeamByCode } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string };
    const team = await getTeamByCode(body.code ?? "");
    if (!team) {
      return NextResponse.json({ error: "No team found with that code." }, { status: 404 });
    }
    return NextResponse.json({ team });
  } catch (e) {
    console.error("team/login", e);
    return NextResponse.json({ error: "Login failed. Try again." }, { status: 500 });
  }
}
