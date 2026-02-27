import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Path parameter is required" }, { status: 400 });
    }

    // Target URL: https://inarisk.bnpb.go.id/api/infografis_chart_new/33/04
    // 33 is Central Java, 04 is Banjarnegara (based on common codes, need to verify)
    // User provided: https://inarisk.bnpb.go.id/api/infografis_chart_new/33/0
    // Let's assume user wants to proxy requests to this base
    
    const targetUrl = `https://inarisk.bnpb.go.id/api/${path}`;
    
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://inarisk.bnpb.go.id/"
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch data: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
