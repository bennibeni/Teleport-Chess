import { NextResponse } from "next/server";
import { getPublicGame } from "../../../../lib/gameStore";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getPublicGame(id);
  if (!state) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  return NextResponse.json({ state });
}
