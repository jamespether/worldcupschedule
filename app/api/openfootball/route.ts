// app/api/openfootball/route.ts
// Proxies the OpenFootball World Cup 2026 JSON dataset.
// Free, public, no API key required.
// Revalidated every hour via Next.js ISR.

export const revalidate = 3600

export async function GET() {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch OpenFootball data", status: res.status },
        { status: 500 }
      )
    }
    const data = await res.json()
    return Response.json(data)
  } catch (err) {
    return Response.json(
      { error: "OpenFootball fetch failed", details: String(err) },
      { status: 500 }
    )
  }
}
