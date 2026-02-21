import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");

  try {
    if (service === "nasa") {
      return NextResponse.json([
        { lat: -7.382, lng: 109.651, temp: "342K", sat: "VIIRS", confidence: "High" },
        { lat: -7.415, lng: 109.712, temp: "318K", sat: "MODIS", confidence: "Nominal" },
        { lat: -7.321, lng: 109.685, temp: "330K", sat: "VIIRS", confidence: "High" }
      ]);
    }

    if (service === "nasa_landslide") {
      // NASA Global Landslide Catalog Export
      const res = await fetch("https://data.nasa.gov/resource/h9d8-u772.json?$limit=50&country_name=Indonesia");
      const data = await res.json();
      // Filter hanya yang dekat Banjarnegara (Lat: -7.3, Lng: 109.6)
      return NextResponse.json(data.filter((l: any) => {
        const lat = parseFloat(l.latitude);
        const lng = parseFloat(l.longitude);
        return lat < -7.0 && lat > -7.6 && lng > 109.3 && lng < 110.0;
      }));
    }

    if (service === "gdacs") {
      const res = await fetch("https://www.gdacs.org/gdacsapi/api/events/geteventlist/map?eventtype=EQ,FL,TC", {
        headers: { "Accept": "application/json" }
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Service not found" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
