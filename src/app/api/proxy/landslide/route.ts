import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const cachePath = path.join(process.cwd(), "public", "data", "cache_landslide.json");
  
  if (fs.existsSync(cachePath)) {
    return NextResponse.json(JSON.parse(fs.readFileSync(cachePath, "utf8")));
  }

  const baseUrl = "https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/13/query";
  const params = new URLSearchParams({
    where: "1=1",
    geometry: "109.3,-7.6,110.0,-7.1",
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    outSR: "4326",
    f: "geojson"
  });

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000); // Batas 15 detik

    const response = await fetch(`${baseUrl}?${params.toString()}`, { 
      signal: controller.signal,
      cache: 'no-store' 
    });
    
    clearTimeout(id);
    if (!response.ok) throw new Error("BIG Failure");
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      fs.writeFileSync(cachePath, JSON.stringify(data));
    }
    return NextResponse.json(data);
  } catch (error) {
    console.warn("BIG API timed out or failed. Returning empty data.");
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }
}