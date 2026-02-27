import { NextResponse } from "next/server";
// Use relative path to avoid alias resolution issues in some environments
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Username atau Password salah" }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (e: any) {
    console.error("Auth API Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
