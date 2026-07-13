import { NextResponse } from "next/server";
import { resignGame } from "../../../../../lib/gameStore";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : null;
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const result = await resignGame(id, token);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ state: result.state });
}
