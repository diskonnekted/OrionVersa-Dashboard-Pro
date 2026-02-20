import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, type, value, battery, wifi, cpuTemp, ram } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const filePath = path.join(process.cwd(), 'public/data/ews_live.json');
    let currentData = [];
    if (fs.existsSync(filePath)) {
      currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    const index = currentData.findIndex((d: any) => d.id === id);
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const entry = {
      id, type, 
      lastValue: value,
      battery: battery || 100,
      wifi: wifi || -50,
      cpuTemp: cpuTemp || 40,
      ram: ram || "200KB",
      timestamp: new Date().toISOString(),
      history: [...(currentData[index]?.history || []).slice(-19), { time: timeStr, value }]
    };

    if (index !== -1) {
      currentData[index] = entry;
    } else {
      currentData.push(entry);
    }

    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}