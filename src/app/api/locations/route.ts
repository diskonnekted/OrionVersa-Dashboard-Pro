import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.paste_errors.findMany({
      select: {
        id: true,
        ruasja: true,
        loksta: true,
        lokasi: true,
        lokasi2: true,
        arti: true,
      },
      take: 500, // Limit data agar tidak terlalu berat di awal
    });

    const locations = data
      .map((item: any) => {
        // Pastikan koordinat tidak null atau undefined
        if (!item.lokasi || !item.lokasi2) return null;

        const lat = parseFloat(String(item.lokasi).replace(/\s/g, ""));
        const lng = parseFloat(String(item.lokasi2).replace(/\s/g, ""));

        if (isNaN(lat) || isNaN(lng)) return null;

        return {
          id: item.id,
          name: item.ruasja || "Tanpa Nama",
          station: item.loksta || "-",
          lat: lat,
          lng: lng,
          description: item.arti || "-",
        };
      })
      .filter((loc) => loc !== null);

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Database error:", error);
    // Selalu kembalikan array kosong jika gagal, bukan objek error
    return NextResponse.json([]);
  }
}
