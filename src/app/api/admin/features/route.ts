import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const features = await prisma.mapFeature.findMany({
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(features);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data fitur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, year, type, geometry, description, icon, color } = body;

    const data: any = {
      name,
      category,
      year: year ? parseInt(String(year)) : null,
      type,
      geometry: typeof geometry === 'string' ? geometry : JSON.stringify(geometry),
      description,
      icon,
      color,
      updated_at: new Date()
    };

    if (id) {
      const feature = await prisma.mapFeature.update({
        where: { id: parseInt(id) },
        data: data
      });
      return NextResponse.json(feature);
    } else {
      const feature = await prisma.mapFeature.create({
        data: data
      });
      return NextResponse.json(feature);
    }
  } catch (error: any) {
    console.error("Error saving feature:", error);
    return NextResponse.json({ error: `Gagal menyimpan: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    await prisma.mapFeature.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus fitur" }, { status: 500 });
  }
}
