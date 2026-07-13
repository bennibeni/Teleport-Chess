import { NextResponse } from "next/server";
import { applyMove, type MoveInput } from "../../../../../lib/gameStore";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.token !== "string" || !body.move) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const move = body.move as MoveInput;
  if (move.kind !== "normal" && move.kind !== "teleport") {
    return NextResponse.json({ error: "Invalid move kind." }, { status: 400 });
  }

  const result = await applyMove(id, body.token, move);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ state: result.state });
}
