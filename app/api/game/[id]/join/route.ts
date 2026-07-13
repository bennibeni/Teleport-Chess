import { NextResponse } from "next/server";
import { joinGame } from "../../../../../lib/gameStore";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const existingToken = typeof body.token === "string" ? body.token : null;

  const result = await joinGame(id, existingToken);
  if (!result) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  return NextResponse.json(result);
}
