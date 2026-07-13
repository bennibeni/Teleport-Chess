"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinId, setJoinId] = useState("");
  const [color, setColor] = useState<"w" | "b">("w");

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create game.");
      localStorage.setItem(`chess-${data.id}`, JSON.stringify({ token: data.token, color: data.color }));
      router.push(`/game/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  function handleJoin() {
    const trimmed = joinId.trim();
    if (!trimmed) return;
    // Accept either a bare game id or a full pasted URL.
    const idMatch = trimmed.match(/([0-9a-f-]{36})/i);
    const id = idMatch ? idMatch[1] : trimmed;
    router.push(`/game/${id}`);
  }

  return (
    <main className="shell">
      <p className="eyebrow">bennibenis-projects</p>
      <h1>Teleport Chess</h1>
      <p className="lede">
        Two-player chess, playable with a friend over a shared link. Standard rules via
        chess.js, plus one special rule.
      </p>

      <div className="rule-box">
        <strong>Teleport rule:</strong> instead of a normal move, you may relocate any one
        of your pieces to the square your opponent&apos;s last-moved piece just vacated
        (highlighted on the board). This can&apos;t leave or put your own king in check. A
        pawn teleported to the last rank automatically promotes to a Queen.
      </div>

      <div className="form-row" role="group" aria-label="Choose your color">
        <button
          className={color === "w" ? "" : "secondary"}
          onClick={() => setColor("w")}
          aria-pressed={color === "w"}
        >
          Play as White
        </button>
        <button
          className={color === "b" ? "" : "secondary"}
          onClick={() => setColor("b")}
          aria-pressed={color === "b"}
        >
          Play as Black
        </button>
      </div>

      <div className="form-row">
        <button onClick={handleCreate} disabled={creating}>
          {creating ? "Creating…" : "Create new game"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      <h2 style={{ marginTop: 36 }}>Have a link already?</h2>
      <div className="form-row">
        <input
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="Paste game link or ID"
          aria-label="Game link or ID"
          style={{ flex: 1, minWidth: 200 }}
        />
        <button className="secondary" onClick={handleJoin}>
          Go to game
        </button>
      </div>

      <nav className="links">
        <a href="https://links-page-bennibeni.vercel.app/" target="_blank" rel="noreferrer">&larr; All projects</a>
      </nav>
    </main>
  );
}
