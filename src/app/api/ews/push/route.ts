import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, type, value, battery, wifi, cpuTemp, ram } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const existingNode = await prisma.ewsNode.findUnique({
      where: { id },
    });

    let history: any = existingNode ? existingNode.history : [];
    if (typeof history === "string") history = JSON.parse(history);

    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    history = [...history.slice(-19), { time: timeStr, value }];

    await prisma.ewsNode.upsert({
      where: { id },
      update: {
        lastValue: parseFloat(value),
        battery: battery || 100,
        wifi: wifi || -50,
        cpuTemp: cpuTemp || 40,
        ram: ram || "240KB",
        updatedAt: new Date(),
        history: JSON.stringify(history),
      },
      create: {
        id,
        type: type || "flood",
        lastValue: parseFloat(value),
        battery: battery || 100,
        wifi: wifi || -50,
        cpuTemp: cpuTemp || 40,
        ram: ram || "240KB",
        history: JSON.stringify(history),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("EWS API Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await prisma.ewsNode.findMany();
    const parsedData = data.map(n => ({
      ...n,
      history: typeof n.history === "string" ? JSON.parse(n.history) : n.history
    }));
    return NextResponse.json(parsedData);
  } catch (e: any) {
    console.error("EWS API Error:", e.message);
    return NextResponse.json([]);
  }
}
