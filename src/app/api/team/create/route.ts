import { NextResponse } from "next/server";
import { createTeam } from "@/lib/server";

export const runtime = "nodejs";

interface CreateTeamBody {
  name?: string;
  member1?: string | { name?: string; sem?: string; class?: string };
  member2?: string | { name?: string; sem?: string; class?: string };
  member1Sem?: string;
  member1Class?: string;
  member2Sem?: string;
  member2Class?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateTeamBody;

    const m1Name = (
      typeof body.member1 === "object" ? body.member1?.name : body.member1
    ) ?? "";
    const m1Sem = (
      typeof body.member1 === "object" ? body.member1?.sem : body.member1Sem
    ) ?? "";
    const m1Class = (
      typeof body.member1 === "object" ? body.member1?.class : body.member1Class
    ) ?? "";

    const m2Name = (
      typeof body.member2 === "object" ? body.member2?.name : body.member2
    ) ?? "";
    const m2Sem = (
      typeof body.member2 === "object" ? body.member2?.sem : body.member2Sem
    ) ?? "";
    const m2Class = (
      typeof body.member2 === "object" ? body.member2?.class : body.member2Class
    ) ?? "";

    const teamNameRaw = (body.name ?? "").trim();
    const cleanM1Name = m1Name.trim();
    const cleanM1Sem = m1Sem.trim();
    const cleanM1Class = m1Class.trim();
    const cleanM2Name = m2Name.trim();
    const cleanM2Sem = m2Sem.trim();
    const cleanM2Class = m2Class.trim();

    if (!cleanM1Name || !cleanM1Sem || !cleanM1Class) {
      return NextResponse.json(
        { error: "Member 1 requires Full Name, Semester, and Class." },
        { status: 400 },
      );
    }

    if (!cleanM2Name || !cleanM2Sem || !cleanM2Class) {
      return NextResponse.json(
        { error: "Member 2 requires Full Name, Semester, and Class." },
        { status: 400 },
      );
    }

    // Default team name to Member1 & Member2 if omitted
    const teamName =
      teamNameRaw || `${cleanM1Name.split(" ")[0]} & ${cleanM2Name.split(" ")[0]}`;

    if (
      teamName.length > 50 ||
      cleanM1Name.length > 50 ||
      cleanM2Name.length > 50 ||
      cleanM1Sem.length > 20 ||
      cleanM2Sem.length > 20 ||
      cleanM1Class.length > 30 ||
      cleanM2Class.length > 30
    ) {
      return NextResponse.json(
        { error: "Please keep field lengths reasonable (under 50 characters)." },
        { status: 400 },
      );
    }

    const team = await createTeam(
      teamName,
      cleanM1Name,
      cleanM2Name,
      cleanM1Sem,
      cleanM1Class,
      cleanM2Sem,
      cleanM2Class,
    );

    return NextResponse.json({ team });
  } catch (e: any) {
    console.error("team/create error:", e);
    const msg = e?.message ?? "";
    if (msg.includes("already exists")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (msg.includes("permission denied") || e?.code === "42501") {
      console.error(
        "CRITICAL: Supabase permission denied (42501). Ensure SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) is configured on the server.",
      );
      return NextResponse.json(
        {
          error:
            "Database configuration error. Please contact event coordinators.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Could not register the team. Please try again." },
      { status: 500 },
    );
  }
}
