import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch legacy markers
    const legacyData = await prisma.paste_errors.findMany({
      select: {
        id: true,
        ruasja: true,
        loksta: true,
        lokasi: true,
        lokasi2: true,
        arti: true,
        status: true,
      },
      take: 200,
    });

    // Fetch new features (points, lines, polygons)
    const newFeatures = await prisma.mapFeature.findMany();

    const legacyLocations = legacyData
      .map((item: any) => {
        if (!item.lokasi || !item.lokasi2) return null;
        const lat = parseFloat(String(item.lokasi).replace(/\s/g, ""));
        const lng = parseFloat(String(item.lokasi2).replace(/\s/g, ""));
        if (isNaN(lat) || isNaN(lng)) return null;

        return {
          id: `legacy-${item.id}`,
          name: item.ruasja || "Tanpa Nama",
          station: item.loksta || "-",
          lat: lat,
          lng: lng,
          description: item.arti || "-",
          category: item.status || "tempat",
          type: "Point",
          geometry: JSON.stringify({ type: "Point", coordinates: [lng, lat] }),
        };
      })
      .filter((loc) => loc !== null);

    const formattedFeatures = newFeatures.map((f: any) => {
      const geom = JSON.parse(f.geometry);
      return {
        id: `feat-${f.id}`,
        name: f.name,
        category: f.category,
        year: f.year,
        type: f.type,
        geometry: f.geometry,
        description: f.description,
        icon: f.icon,
        color: f.color,
        // For backwards compatibility with point markers
        lat: f.type === "Point" ? geom.coordinates[1] : null,
        lng: f.type === "Point" ? geom.coordinates[0] : null,
      };
    });

    return NextResponse.json([...legacyLocations, ...formattedFeatures]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json([]);
  }
}
