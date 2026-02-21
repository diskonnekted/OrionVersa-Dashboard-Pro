import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get("incidentId");
    const limitParam = searchParams.get("limit");
    const take = limitParam ? parseInt(limitParam) || 5 : 5;

    const where = incidentId ? { incidentId } : {};

    const responses = await prisma.responseReport.findMany({
      where,
      orderBy: { created_at: "desc" },
      take,
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Get Responses Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data respon" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      incidentId,
      type,
      district,
      village,
      hamlet,
      address,
      chronology,
      impact,
      handling,
      teamLeader,
      teamMembers,
      notes,
    } = body;

    if (!incidentId || !chronology || !impact || !handling) {
      return NextResponse.json(
        { error: "incidentId, chronology, impact, dan handling wajib diisi" },
        { status: 400 }
      );
    }

    const response = await prisma.responseReport.create({
      data: {
        incidentId,
        type: type || "Longsor",
        district: district || "",
        village: village || "",
        hamlet: hamlet || "",
        address: address || "",
        chronology,
        impact,
        handling,
        teamLeader: teamLeader || "",
        teamMembers: teamMembers || "",
        notes: notes || "",
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Create Response Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan respon" }, { status: 500 });
  }
}

