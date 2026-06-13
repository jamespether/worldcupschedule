// lib/team-names.ts
// Canonical team name aliases so we can match OpenFootball names to app names.
// OpenFootball uses full FIFA names; the app uses common English names.
// All values are lowercase canonical forms.

export const TEAM_ALIASES: Record<string, string> = {
  // USA
  "usa":                       "usa",
  "united states":             "usa",
  "us":                        "usa",

  // Czech Republic / Czechia
  "czech republic":            "czechia",
  "czechia":                   "czechia",

  // South Korea
  "south korea":               "south korea",
  "korea republic":            "south korea",
  "korea":                     "south korea",

  // Ivory Coast
  "ivory coast":               "ivory coast",
  "cote d'ivoire":            "ivory coast",
  "cote divoire":              "ivory coast",

  // Bosnia
  "bosnia":                    "bosnia & herz.",
  "bosnia and herzegovina":    "bosnia & herz.",
  "bosnia & herz.":            "bosnia & herz.",
  "bosnia & herzegovina":      "bosnia & herz.",

  // DR Congo
  "dr congo":                  "dr congo",
  "congo dr":                  "dr congo",
  "democratic republic of congo": "dr congo",

  // Everything else maps to itself (lowercased)
}

export function normaliseTeamName(name: string): string {
  const lower = name.toLowerCase().trim()
  return TEAM_ALIASES[lower] ?? lower
}
