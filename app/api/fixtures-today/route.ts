// app/api/fixtures-today/route.ts
// Fetches today's World Cup fixtures from api-football.
// Cached for 6 hours via Next.js revalidate — costs 1 API call per 6hr window per day.
// Returns simplified fixture list with status and scores.

import { NextResponse } from "next/server"

const API_BASE = "https://v3.football.api-sports.io"
const LEAGUE   = 1      // FIFA World Cup (permanent ID in api-football v3)
const SEASON   = 2026

// BST = UTC+1. Get today's date in BST regardless of server timezone.
function todayBST(): string {
  const now = new Date()
  // Add 1hr to UTC to get BST, then format as YYYY-MM-DD
  const bst = new Date(now.getTime() + 60 * 60 * 1000)
  return bst.toISOString().split("T")[0]
}

export const revalidate = 21600 // 6 hours — Next.js ISR cache

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) {
    return NextResponse.json({ error: "API_FOOTBALL_KEY not set" }, { status: 500 })
  }

  const date = todayBST()

  try {
    const res = await fetch(
      `${API_BASE}/fixtures?league=${LEAGUE}&season=${SEASON}&date=${date}`,
      {
        headers: {
          "x-apisports-key": key,
        },
        // Next.js fetch cache — revalidates every 6 hours
        next: { revalidate: 21600 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}` }, { status: 502 })
    }

    const remaining = res.headers.get("x-ratelimit-requests-remaining")
    const data = await res.json()

    // Normalise to a simple shape the frontend cares about
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixtures = (data.response || []).map((f: any) => ({
      fixtureId:  f.fixture.id,
      status:     f.fixture.status.short,   // NS, 1H, HT, 2H, ET, PEN, FT, AET, PEN
      elapsed:    f.fixture.status.elapsed, // minutes played, null if not started
      homeTeam:   f.teams.home.name,
      awayTeam:   f.teams.away.name,
      homeGoals:  f.goals.home,             // null before kick-off
      awayGoals:  f.goals.away,
      kickoffUTC: f.fixture.date,           // ISO string in UTC
    }))

    return NextResponse.json(
      { date, fixtures, remainingCalls: remaining },
      {
        headers: {
          // Public CDN cache for 6 hours, stale-while-revalidate for another 30min
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=1800",
        },
      }
    )
  } catch (err) {
    console.error("fixtures-today error:", err)
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}
