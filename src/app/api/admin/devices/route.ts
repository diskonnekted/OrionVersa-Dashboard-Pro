import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const devices = await prisma.ews_stations.findMany({
      orderBy: { updated_at: 'desc' }
    });
    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data perangkat" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, location, sensor_code, type, status, latitude, longitude, description } = body;

    if (id) {
      // Update
      const device = await prisma.ews_stations.update({
        where: { id: parseInt(id) },
        data: {
          name,
          location,
          sensor_code,
          type,
          status,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          description,
          updated_at: new Date()
        }
      });
      return NextResponse.json(device);
    } else {
      // Create
      const device = await prisma.ews_stations.create({
        data: {
          name,
          location,
          sensor_code,
          type,
          status: status || "aktif",
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          description
        }
      });
      return NextResponse.json(device);
    }
  } catch (error) {
    console.error("Error saving device:", error);
    return NextResponse.json({ error: "Gagal menyimpan data perangkat" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    await prisma.ews_stations.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus perangkat" }, { status: 500 });
  }
}
