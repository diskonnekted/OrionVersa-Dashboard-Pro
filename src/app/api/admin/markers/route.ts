import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const markers = await prisma.paste_errors.findMany({
      orderBy: { id: 'desc' },
      take: 1000 // Limit to avoid performance issues
    });
    return NextResponse.json(markers);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data marker" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, station, lat, lng, description, noreg, category, status, loksta } = body;

    // Mapping fields for paste_errors model
    // Using 'status' field to store the Layer ID (Category)
    const data: any = {
      ruasja: name,
      loksta: station || loksta,
      lokasi: String(lat),
      lokasi2: String(lng),
      arti: description,
      noreg: noreg,
      status: category || status || "tempat", // Default to 'tempat' if no category
    };

    if (id) {
      // Update
      const marker = await prisma.paste_errors.update({
        where: { id: parseInt(id) },
        data: data
      });
      return NextResponse.json(marker);
    } else {
      // Create
      const marker = await prisma.paste_errors.create({
        data: data
      });
      return NextResponse.json(marker);
    }
  } catch (error) {
    console.error("Error saving marker:", error);
    return NextResponse.json({ error: "Gagal menyimpan data marker" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    await prisma.paste_errors.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus marker" }, { status: 500 });
  }
}
