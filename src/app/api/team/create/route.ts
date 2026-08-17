import { NextResponse } from "next/server";
import { createTeam } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; member1?: string; member2?: string };
    const name = (body.name ?? "").trim();
    const member1 = (body.member1 ?? "").trim();
    const member2 = (body.member2 ?? "").trim();
    if (!name || !member1 || !member2) {
      return NextResponse.json(
        { error: "Team name and both member names are required." },
        { status: 400 },
      );
    }
    if (name.length > 40 || member1.length > 40 || member2.length > 40) {
      return NextResponse.json({ error: "Names must be under 40 characters." }, { status: 400 });
    }
    const team = await createTeam(name, member1, member2);
    return NextResponse.json({ team });
  } catch (e) {
    console.error("team/create", e);
    return NextResponse.json({ error: "Could not register the team. Try again." }, { status: 500 });
  }
}
