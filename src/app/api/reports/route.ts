import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reports = await prisma.publicReport.findMany({
      orderBy: { timestamp: 'desc' }
    });
    // Parse verif field from string to JSON
    const parsedReports = reports.map(r => ({
      ...r,
      verif: typeof r.verif === 'string' ? JSON.parse(r.verif) : r.verif
    }));
    return NextResponse.json(parsedReports);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, lat, lng, type, district, village, address, desc, name, phone, photo, status, isValidated, verif } = body;

    if (id && id > 1000000000000) { // If it looks like a temporary frontend ID, don't use it as primary key
      // This is a new report
      const report = await prisma.publicReport.create({
        data: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          type,
          district,
          village,
          address,
          desc,
          name,
          phone,
          photo: photo || "",
          status: status || "Diterima",
          isValidated: isValidated || false,
          verif: JSON.stringify(verif || { reporter: false, village: false, residents: false })
        }
      });
      return NextResponse.json(report);
    } else if (id) {
      // Update existing
      const report = await prisma.publicReport.update({
        where: { id: parseInt(id) },
        data: {
          status,
          isValidated,
          verif: typeof verif === 'string' ? verif : JSON.stringify(verif)
        }
      });
      return NextResponse.json(report);
    } else {
      // Create new without ID
      const report = await prisma.publicReport.create({
        data: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          type, district, village, address, desc, name, phone,
          photo: photo || "",
          verif: JSON.stringify({ reporter: false, village: false, residents: false })
        }
      });
      return NextResponse.json(report);
    }
  } catch (error: any) {
    console.error("Save Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  try {
    await prisma.publicReport.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
