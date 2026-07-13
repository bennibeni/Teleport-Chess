# Teleport Chess

Two-player chess playable over a shared room link, with one special rule on top of
standard chess (enforced via [chess.js](https://github.com/jhlywa/chess.js)):

> **Teleport rule:** instead of a normal move, a player may relocate any one of their
> own pieces to the square the opponent's last-moved piece just vacated. This is
> illegal if it would leave or put the mover's own king in check. A pawn teleported to
> the last rank automatically promotes to a Queen. Checkmate/stalemate detection
> accounts for this: a position isn't checkmate if a teleport would escape it.

## Architecture

- **Next.js App Router**, deployed as a Vercel project.
- **Redis (Upstash, via Vercel Marketplace)** holds each game's shared state (FEN,
  turn, move history, player tokens) so both browsers see the same game.
- Clients **poll** `GET /api/game/[id]` every ~1.5s to see the opponent's moves — no
  WebSocket/realtime service needed.
- `lib/chess-teleport.ts` — the teleport rule logic, layered on top of chess.js.
  Covered by `test.js`-style checks during development (17 scenarios: normal
  teleport, illegal self-check, pawn auto-promotion, occupied-square rejection,
  variant-aware checkmate override, etc.).
- `lib/gameStore.ts` — game creation, joining (room-link based, first joiner is
  White, second is Black, others are read-only spectators), and move application
  with server-side turn/token validation (never trust the client).

## Project structure

```text
app/
  page.tsx                  Home: create a game or paste a link to join
  game/[id]/page.tsx         The board (click-to-move, teleport button, polling)
  api/game/route.ts          POST -> create a game
  api/game/[id]/route.ts     GET  -> current public game state
  api/game/[id]/join/route.ts  POST -> join/resume as a seat or spectator
  api/game/[id]/move/route.ts  POST -> submit a normal or teleport move
lib/
  chess-teleport.ts   Teleport rule engine (pure functions, no I/O)
  gameStore.ts         Game state transitions (uses chess-teleport.ts + redis.ts)
  redis.ts             Upstash Redis client wrapper
```

## Local setup

```powershell
npm install
```

You need a Redis instance for local dev too. Easiest: create the free Upstash Redis
database from [https://console.upstash.com](https://console.upstash.com) (or install it on a throwaway Vercel
project first and copy the env vars). Then create `.env.local`:

```text
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

Then:

```powershell
npm run dev
```

Open two different browsers (or one normal + one incognito window, since each stores
its own room token in localStorage) at `http://localhost:3000`, create a game in one,
open the link in the other.

## Deploy to Vercel

1. Push this project to a GitHub repo, import it on
   [https://vercel.com/torredihanois-projects](https://vercel.com/torredihanois-projects) (same flow as your other projects: Add
   New -> Project -> import repo -> Deploy).
2. **Add Redis**: in the Vercel project -> **Storage** tab -> **Marketplace** ->
   search "Redis" -> install the **Upstash Redis** integration -> connect it to this
   project. This automatically injects `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` (or similarly-named vars) into your project's
   environment variables.
3. Check **Project Settings -> Environment Variables** for the exact variable names
   the integration created. If they differ from `UPSTASH_REDIS_REST_URL` /
   `UPSTASH_REDIS_REST_TOKEN`, update `lib/redis.ts` to match (or simplest: rename the
   vars in the Vercel dashboard to those exact names).
4. Redeploy (Vercel does this automatically after adding env vars, or push a commit).

## Known simplifications

- Castling is treated as vacating only the king's origin square (not the rook's) for
  teleport purposes — a reasonable simplification the rule doesn't explicitly cover.
- No threefold-repetition or 50-move-rule draw detection across teleport moves
  (chess.js tracks this only for its own standard moves).
- If a player clears their browser storage mid-game, they lose their seat token and
  will rejoin as a spectator next time (their opponent can keep playing; there's no
  reconnect-by-password mechanism).
- Games are stored with a 7-day TTL in Redis and expire automatically after that.
