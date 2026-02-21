import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BNPB_BASE_URL =
  "https://gis.bnpb.go.id/server/rest/services/Hosted/Join_Data_Harian/FeatureServer/3/query";

const buildWhereClause = (tahun: string, kabkot: string) => {
  const year = tahun || "2025";
  const region = kabkot || "Banjarnegara";
  return `tahun='${year}' AND kabkot LIKE '%${region}%'`;
};

const parseTanggal = (value: any) => {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const tahun = body.tahun || "2025";
    const kabkot = body.kabkot || "Banjarnegara";

    const params = new URLSearchParams({
      where: buildWhereClause(tahun, kabkot),
      outFields: "*",
      f: "json",
      resultRecordCount: "2000",
    });

    const response = await fetch(`${BNPB_BASE_URL}?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil data dari BNPB" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const features = Array.isArray(data.features) ? data.features : [];

    let created = 0;
    let updated = 0;

    for (const feature of features) {
      const a = feature.attributes || {};

      const tanggal = parseTanggal(a.tanggal);
      const kabkotValue = a.kabkot ? String(a.kabkot) : "";
      const jenisBencanaValue = a.jenis_bencana ? String(a.jenis_bencana) : "";

      if (!tanggal || !kabkotValue || !jenisBencanaValue) continue;

      const record = {
        tanggal,
        tahun: a.tahun ? String(a.tahun) : null,
        bulan: a.bulan ? String(a.bulan) : null,
        provinsi: a.provinsi ? String(a.provinsi) : null,
        kabkot: kabkotValue,
        kecamatan: a.kecamatan ? String(a.kecamatan) : null,
        jenisBencana: jenisBencanaValue,
        jenisEntry: a.jenis_entry ? String(a.jenis_entry) : null,
        kodeKabkot:
          typeof a.kodekabkot === "number"
            ? a.kodekabkot
            : a.kodekabkot
            ? parseInt(String(a.kodekabkot)) || null
            : null,
        md:
          typeof a.md === "number"
            ? a.md
            : a.md
            ? parseInt(String(a.md)) || null
            : null,
        trdmpk:
          typeof a.trdmpk === "number"
            ? a.trdmpk
            : a.trdmpk
            ? parseInt(String(a.trdmpk)) || null
            : null,
        rmhFasub:
          typeof a.rmh_fasub === "number"
            ? a.rmh_fasub
            : a.rmh_fasub
            ? parseInt(String(a.rmh_fasub)) || null
            : null,
        bngnTrdm:
          typeof a.bngn_trdm === "number"
            ? a.bngn_trdm
            : a.bngn_trdm
            ? parseInt(String(a.bngn_trdm)) || null
            : null,
        lahan:
          typeof a.lahan === "number"
            ? a.lahan
            : a.lahan
            ? parseFloat(String(a.lahan)) || null
            : null,
        tglInputRaw: a.tgl_input ? String(a.tgl_input) : null,
        tglUpdateRaw: a.tgl_update ? String(a.tgl_update) : null,
      };

      const existing = await prisma.bnpbDailySummary.findUnique({
        where: {
          tanggal_kabkot_jenisBencana: {
            tanggal,
            kabkot: kabkotValue,
            jenisBencana: jenisBencanaValue,
          },
        },
      });

      if (existing) {
        await prisma.bnpbDailySummary.update({
          where: {
            tanggal_kabkot_jenisBencana: {
              tanggal,
              kabkot: kabkotValue,
              jenisBencana: jenisBencanaValue,
            },
          },
          data: record,
        });
        updated += 1;
      } else {
        await prisma.bnpbDailySummary.create({
          data: record,
        });
        created += 1;
      }
    }

    return NextResponse.json({
      success: true,
      tahun,
      kabkot,
      total: features.length,
      created,
      updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal sinkronisasi BNPB" },
      { status: 500 }
    );
  }
}

