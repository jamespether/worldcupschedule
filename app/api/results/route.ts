// app/api/results/route.ts
// Fetches ALL World Cup 2026 fixtures from tournament start to today.
// Unlike /api/live (active only) and /api/fixtures-today (today only),
// this gives us every result across all previous matchdays — the correct
// source for finished scores and group table calculations.
//
// Cached for 6 hours via Next.js ISR. On a free plan (100 calls/day) this
// costs at most 4 calls/day (24h / 6h). The live poll is separate.

import { NextResponse } from "next/server"

const API_BASE   = "https://v3.football.api-sports.io"
const LEAGUE     = 1       // FIFA World Cup (permanent ID)
const SEASON     = 2026
const START_DATE = "2026-06-11"

const FINISHED = new Set(["FT", "AET", "PEN"])

function todayBST(): string {
  // BST = UTC + 1h
  return new Date(Date.now() + 3600000).toISOString().split("T")[0]
}

export const revalidate = 21600 // 6 hours

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) {
    return NextResponse.json({ error: "API_FOOTBALL_KEY not set" }, { status: 500 })
  }

  const today = todayBST()

  try {
    const res = await fetch(
      `${API_BASE}/fixtures?league=${LEAGUE}&season=${SEASON}&from=${START_DATE}&to=${today}`,
      {
        headers: { "x-apisports-key": key },
        next:    { revalidate: 21600 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}` }, { status: 502 })
    }

    const remaining = res.headers.get("x-ratelimit-requests-remaining")
    const data = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixtures = (data.response || []).map((f: any) => ({
      fixtureId:  f.fixture.id                   as number,
      status:     f.fixture.status.short         as string,
      homeTeam:   f.teams.home.name              as string,
      awayTeam:   f.teams.away.name              as string,
      // Only expose goals when the match has genuinely finished
      homeGoals:  FINISHED.has(f.fixture.status.short) ? (f.goals.home  as number | null) : null,
      awayGoals:  FINISHED.has(f.fixture.status.short) ? (f.goals.away  as number | null) : null,
      kickoffUTC: f.fixture.date                 as string,
    }))

    return NextResponse.json(
      { fixtures, remainingCalls: remaining },
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=1800",
        },
      }
    )
  } catch (err) {
    console.error("results route error:", err)
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}
