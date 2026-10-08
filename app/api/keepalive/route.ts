import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

// Chiamata settimanalmente dal Cron Job di Vercel (vedi vercel.json) per
// tenere attivo il database Upstash Redis, che altrimenti viene segnalato
// come inattivo e poi archiviato quando nessuno gioca per un po'.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Se CRON_SECRET è impostato su Vercel, il cron invia
  // "Authorization: Bearer <CRON_SECRET>" e rifiutiamo le altre chiamate.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date().toISOString();
  await redis.set("keepalive", now);
  return NextResponse.json({ ok: true, at: now });
}
