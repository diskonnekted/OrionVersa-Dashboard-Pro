import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get("tahun") || "2025";
    const kabkot = searchParams.get("kabkot") || "Banjarnegara";

    const items = await prisma.bnpbDailySummary.findMany({
      where: {
        tahun,
        kabkot: {
          contains: kabkot,
          mode: "insensitive",
        },
      },
      orderBy: {
        tanggal: "asc",
      },
    });

    const aggMap = new Map<
      string,
      {
        jenisBencana: string;
        kejadian: number;
        md: number;
        trdmpk: number;
        rmhFasub: number;
        bngnTrdm: number;
        lahan: number;
      }
    >();

    items.forEach((row) => {
      const key = row.jenisBencana || "Tidak Diketahui";
      if (!aggMap.has(key)) {
        aggMap.set(key, {
          jenisBencana: key,
          kejadian: 0,
          md: 0,
          trdmpk: 0,
          rmhFasub: 0,
          bngnTrdm: 0,
          lahan: 0,
        });
      }
      const agg = aggMap.get(key)!;
      agg.kejadian += 1;
      agg.md += row.md || 0;
      agg.trdmpk += row.trdmpk || 0;
      agg.rmhFasub += row.rmhFasub || 0;
      agg.bngnTrdm += row.bngnTrdm || 0;
      agg.lahan += row.lahan || 0;
    });

    const byJenisBencana = Array.from(aggMap.values());

    return NextResponse.json({
      filters: { tahun, kabkot },
      items,
      byJenisBencana,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data BNPB" },
      { status: 500 }
    );
  }
}

