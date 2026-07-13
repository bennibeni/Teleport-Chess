import { NextResponse } from "next/server";
import { createGame } from "../../../lib/gameStore";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const requestedColor = body.color === "b" ? "b" : "w";
  const { id, token, color } = await createGame(requestedColor);
  return NextResponse.json({ id, token, color });
}
