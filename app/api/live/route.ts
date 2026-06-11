// app/api/live/route.ts
// Returns live scores for any World Cup matches currently in progress.
// Cached for 90 seconds — the minimum useful polling interval.
// The frontend only calls this route when a match should be in progress,
// so on quiet days (no matches, or matches not yet started) zero calls are made.

import { NextResponse } from "next/server"

const API_BASE = "https://v3.football.api-sports.io"
const LEAGUE   = 1   // FIFA World Cup

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) {
    return NextResponse.json({ error: "API_FOOTBALL_KEY not set" }, { status: 500 })
  }

  try {
    // /fixtures?live=all returns every in-progress match across all leagues.
    // Filtering by league= alongside live= isn't supported by the API, so we
    // fetch all live and filter to league 1 on our side — still one call.
    const res = await fetch(`${API_BASE}/fixtures?live=all`, {
      headers: { "x-apisports-key": key },
      // No Next.js cache here — we want fresh data every request.
      // The 90s CDN header below is what throttles calls.
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}` }, { status: 502 })
    }

    const remaining = res.headers.get("x-ratelimit-requests-remaining")
    const data = await res.json()

    // Filter to World Cup only and normalise
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const live = (data.response || [])
      .filter((f: any) => f.league.id === LEAGUE)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((f: any) => ({
        fixtureId:  f.fixture.id,
        status:     f.fixture.status.short,    // 1H, HT, 2H, ET, PEN
        elapsed:    f.fixture.status.elapsed,  // minutes e.g. 67
        homeTeam:   f.teams.home.name,
        awayTeam:   f.teams.away.name,
        homeGoals:  f.goals.home,
        awayGoals:  f.goals.away,
        // Events give us the last goal scorer — nice to show but optional
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events: (f.events || []).filter((e: any) => e.type === "Goal").map((e: any) => ({
          team:   e.team.name,
          player: e.player.name,
          minute: e.time.elapsed,
        })),
      }))

    return NextResponse.json(
      { live, remainingCalls: remaining },
      {
        headers: {
          // 90 second CDN cache — Vercel Edge will serve cached response to
          // all concurrent users, so many visitors = still just 1 API call/90s
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=30",
        },
      }
    )
  } catch (err) {
    console.error("live route error:", err)
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}
