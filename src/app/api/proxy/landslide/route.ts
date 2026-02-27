import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  // Cek cache lokal dulu
  const cachePath = path.join(process.cwd(), "public", "data", "cache_landslide.json");
  if (fs.existsSync(cachePath)) {
    try {
      const cachedData = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      if (cachedData && cachedData.type === "FeatureCollection") {
        return NextResponse.json(cachedData);
      }
    } catch (e) {
      // Cache rusak, abaikan
    }
  }

  // Jika tidak ada cache, coba fetch dari BIG
  const baseUrl = "https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/13/query";
  const params = new URLSearchParams({
    where: "1=1",
    geometry: "109.3,-7.6,110.0,-7.1", // Bounding Box Banjarnegara
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    outSR: "4326",
    f: "geojson"
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`, { 
      signal: AbortSignal.timeout(10000), // Timeout 10 detik
      cache: 'no-store' 
    });
    
    if (!response.ok) {
        console.error("BIG API Error:", response.status, response.statusText);
        // Return kosong daripada error agar frontend tidak crash
        return NextResponse.json({ type: "FeatureCollection", features: [] });
    }
    
    const data = await response.json();
    
    // Simpan ke cache jika data valid
    if (data && data.features && data.features.length > 0) {
      try {
        // Pastikan folder ada
        const dir = path.dirname(cachePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(cachePath, JSON.stringify(data));
      } catch (err) {
        console.error("Gagal menulis cache landslide:", err);
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("BIG API Fetch Failed:", error);
    // Return data kosong jika gagal total
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }
}
