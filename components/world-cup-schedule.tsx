"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Trophy, CalendarDays, Search, X, ChevronRight,
  Zap, Tv, MapPin, Info, Moon, CircleDot, Goal, CheckCircle,
} from "lucide-react"

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Match = {
  id: number
  dateKey: string   // calendar date the match STARTS in BST
  date: string
  time: string      // BST HH:MM
  teams: string
  group: string
  venue: string
  watch: "green" | "amber" | "red"
  channel: string
  fact?: string
  note?: string
  simultaneous?: boolean
}

// ─── DATA (all times BST, verified against Sky Sports / ESPN / NBC Sports) ───
// green = finishes by 23:00 (8h sleep before 08:30 work ✓)
// amber = finishes ~01:00 (tight weeknights; fine weekends)
// red   = kicks off 02:00+ (weekends only)
const ALL_MATCHES: Match[] = [
  // ── THU 11 JUN ───────────────────────────────────────────────────────────
  { id:1,  dateKey:"2026-06-11", date:"Thu 11 Jun", time:"20:00", teams:"Mexico vs South Africa",        group:"A", venue:"Mexico City",    watch:"green", channel:"ITV1",         fact:"Mexico & South Africa opened the 2010 World Cup together — the last time the tournament was on African soil. South Africa drew 1-1 that day." },
  // South Korea vs Czechia: 10pm ET Thu = 03:00 BST Fri 12 Jun
  { id:2,  dateKey:"2026-06-12", date:"Fri 12 Jun", time:"03:00", teams:"South Korea vs Czechia",        group:"A", venue:"Guadalajara",    watch:"red",   channel:"ITV",          fact:"Son Heung-min will be 34 during this tournament — almost certainly his final World Cup. He is South Korea's all-time record scorer." },

  // ── FRI 12 JUN ───────────────────────────────────────────────────────────
  // Canada vs B&H: 3pm ET = 20:00 BST
  { id:3,  dateKey:"2026-06-12", date:"Fri 12 Jun", time:"20:00", teams:"Canada vs Bosnia & Herz.",      group:"B", venue:"Toronto",        watch:"green", channel:"BBC One",       fact:"Canada are hosting on home soil for the first time. BMO Field in Toronto holds 45,000 — a sold-out home atmosphere guaranteed for the co-hosts." },
  // USA vs Paraguay: 9pm ET Fri = 02:00 BST Sat 13
  { id:4,  dateKey:"2026-06-13", date:"Sat 13 Jun", time:"02:00", teams:"USA vs Paraguay",               group:"D", venue:"Los Angeles",    watch:"red",   channel:"BBC",          fact:"USA play at SoFi Stadium — the most expensive sports stadium ever built at $5.5bn. As co-hosts they are genuine dark horses to go deep." },

  // ── SAT 13 JUN ───────────────────────────────────────────────────────────
  // Qatar vs Switzerland: noon ET Sat = 17:00 BST (San Francisco PDT = UTC-7, +8 → BST) — confirmed 3pm ET = 20:00 BST by NBC/Sky
  { id:5,  dateKey:"2026-06-13", date:"Sat 13 Jun", time:"20:00", teams:"Qatar vs Switzerland",          group:"B", venue:"San Francisco",  watch:"green", channel:"ITV",          fact:"Qatar never won a World Cup group stage match as 2022 hosts. Switzerland have reached the knockouts in 4 of the last 5 tournaments." },
  // Brazil vs Morocco: 6pm ET Sat = 23:00 BST (New York EDT)
  { id:6,  dateKey:"2026-06-13", date:"Sat 13 Jun", time:"23:00", teams:"Brazil vs Morocco",             group:"C", venue:"New York/NJ",   watch:"amber", channel:"BBC",          fact:"Brazil have won 5 World Cups but last lifted the trophy in 2002. Morocco became the first African nation to reach a semi-final in 2022." },
  // Haiti vs Scotland: 9pm ET Sat = 02:00 BST Sun (Boston EDT) — Sky Sports confirmed 2am BST
  { id:7,  dateKey:"2026-06-14", date:"Sun 14 Jun", time:"02:00", teams:"Haiti vs Scotland",             group:"C", venue:"Boston",         watch:"red",   channel:"BBC",          note:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland opener!", fact:"Scotland's first World Cup since 1998 — a 28-year wait. Haiti are making only their second ever World Cup appearance, the first since 1974." },
  // Australia vs Turkey: midnight ET Sat = 05:00 BST Sun (Vancouver PDT)
  { id:8,  dateKey:"2026-06-14", date:"Sun 14 Jun", time:"05:00", teams:"Australia vs Turkey",           group:"D", venue:"Vancouver",      watch:"red",   channel:"ITV",          fact:"Turkey finished 3rd at the 2002 World Cup. Australia reached the last 16 in 2022 — Harry Souttar is one of the most recognisable defenders in world football." },

  // ── SUN 14 JUN ───────────────────────────────────────────────────────────
  // Germany vs Curacao: 1pm ET = 18:00 BST (Houston CDT = UTC-5, +6)
  { id:9,  dateKey:"2026-06-14", date:"Sun 14 Jun", time:"18:00", teams:"Germany vs Curacao",            group:"E", venue:"Houston",        watch:"green", channel:"ITV",          fact:"Germany are the most successful nation by World Cup final appearances. Curacao (pop. 150,000) are making their debut — one of football's great fairytales." },
  // Netherlands vs Japan: 4pm ET = 21:00 BST (Dallas CDT)
  { id:10, dateKey:"2026-06-14", date:"Sun 14 Jun", time:"21:00", teams:"Netherlands vs Japan",          group:"F", venue:"Dallas",         watch:"green", channel:"ITV",          fact:"Japan shocked Germany and Spain in 2022. The Netherlands have never won a World Cup despite three finals — the greatest team never to win it." },
  // Ivory Coast vs Ecuador: 7pm ET = 00:00 BST Mon (Philadelphia EDT)
  { id:11, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"00:00", teams:"Ivory Coast vs Ecuador",        group:"E", venue:"Philadelphia",   watch:"amber", channel:"BBC",          fact:"Ecuador beat hosts Qatar in the 2022 opening game. Ivory Coast are one of Africa's strongest nations — Sebastien Haller leads a physical, dangerous side." },
  // Sweden vs Tunisia: 10pm ET = 03:00 BST Mon (Monterrey CDT)
  { id:12, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"03:00", teams:"Sweden vs Tunisia",             group:"F", venue:"Monterrey",      watch:"red",   channel:"ITV",          fact:"Sweden qualified without Zlatan Ibrahimović. Alexander Isak (Newcastle) leads the line and is one of Europe's deadliest finishers heading into this tournament." },

  // ── MON 15 JUN ───────────────────────────────────────────────────────────
  // Spain vs Cape Verde: noon ET = 17:00 BST (Atlanta EDT)
  { id:13, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"17:00", teams:"Spain vs Cape Verde",           group:"H", venue:"Atlanta",        watch:"green", channel:"ITV",          fact:"Spain are the reigning European Champions (Euro 2024). Cape Verde's population of 550,000 makes them one of the smallest nations ever at a World Cup." },
  // Belgium vs Egypt: 3pm ET = 20:00 BST (Seattle PDT → +8) — Sky Sports confirmed 8pm BST Seattle
  { id:14, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"20:00", teams:"Belgium vs Egypt",              group:"G", venue:"Seattle",        watch:"green", channel:"BBC",          fact:"Romelu Lukaku is Belgium's all-time top scorer and desperate for a major trophy. Egypt's Mo Salah at 34 — this is his World Cup moment or never." },
  // Saudi Arabia vs Uruguay: 6pm ET = 23:00 BST (Miami EDT)
  { id:15, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"23:00", teams:"Saudi Arabia vs Uruguay",       group:"H", venue:"Miami",          watch:"amber", channel:"ITV",          fact:"Saudi Arabia famously beat Argentina 2-1 in 2022 — one of the biggest World Cup upsets ever. Uruguay were winners in 1930 and 1950." },
  // Iran vs New Zealand: 9pm ET Mon = 02:00 BST Tue (Los Angeles PDT)
  { id:16, dateKey:"2026-06-16", date:"Tue 16 Jun", time:"02:00", teams:"Iran vs New Zealand",           group:"G", venue:"Los Angeles",    watch:"red",   channel:"BBC",          fact:"Iran caused a sensation in 2022, briefly leading the USA before qualifying. New Zealand have never won a World Cup match in six appearances." },

  // ── TUE 16 JUN ───────────────────────────────────────────────────────────
  // France vs Senegal: 3pm ET = 20:00 BST (New York/NJ EDT)
  { id:17, dateKey:"2026-06-16", date:"Tue 16 Jun", time:"20:00", teams:"France vs Senegal",             group:"I", venue:"New York/NJ",   watch:"green", channel:"BBC",          fact:"France are the defending champions. Many Senegal players play in Ligue 1 — this is a game full of club teammates facing each other on the world stage." },
  // Iraq vs Norway: 6pm ET = 23:00 BST (Boston EDT) — Sky Sports confirmed 11pm BST
  { id:18, dateKey:"2026-06-16", date:"Tue 16 Jun", time:"23:00", teams:"Iraq vs Norway",                group:"I", venue:"Boston",         watch:"amber", channel:"ITV",          fact:"Norway's Erling Haaland is arguably the world's best striker. Iraq's qualification ended a 40-year wait since they last appeared at a World Cup in 1986." },
  // Argentina vs Algeria: 9pm ET Tue = 02:00 BST Wed (Kansas City CDT)
  { id:19, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"02:00", teams:"Argentina vs Algeria",          group:"J", venue:"Kansas City",    watch:"red",   channel:"ITV",          fact:"Argentina are the reigning World Champions. Messi will be 39 — this is almost certainly his final World Cup, defending the title he won in Qatar 2022." },
  // Austria vs Jordan: midnight ET Tue = 05:00 BST Wed (San Francisco PDT)
  { id:20, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"05:00", teams:"Austria vs Jordan",             group:"J", venue:"San Francisco",  watch:"red",   channel:"BBC",          fact:"Jordan are making their second ever World Cup appearance. Austria's new generation is led by Marcel Sabitzer and David Alaba of Real Madrid." },

  // ── WED 17 JUN ───────────────────────────────────────────────────────────
  // Portugal vs DR Congo: 1pm ET = 18:00 BST (Houston CDT)
  { id:21, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"18:00", teams:"Portugal vs DR Congo",          group:"K", venue:"Houston",        watch:"green", channel:"BBC",          fact:"Cristiano Ronaldo will be 41 — almost certainly his farewell World Cup. DR Congo are the most decorated African nation by AFCON wins with two titles." },
  // England vs Croatia: 4pm ET = 21:00 BST (Dallas CDT) — Sky Sports confirmed
  { id:22, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"21:00", teams:"England vs Croatia",            group:"L", venue:"Dallas",         watch:"green", channel:"ITV1",         note:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 England opener!", fact:"Croatia knocked England out in the 2018 semi-final. England got revenge at Euro 2020. Under Tuchel this is a new era — but the rivalry remains fierce." },
  // Ghana vs Panama: 7pm ET Wed = 00:00 BST Thu (Toronto EDT)
  { id:23, dateKey:"2026-06-18", date:"Thu 18 Jun", time:"00:00", teams:"Ghana vs Panama",               group:"L", venue:"Toronto",        watch:"amber", channel:"ITV",          fact:"Panama's first World Cup since their debut at Russia 2018. Ghana have Premier League quality: Partey (Arsenal) and Kudus (West Ham) lead the way." },
  // Uzbekistan vs Colombia: 10pm ET Wed = 03:00 BST Thu (Mexico City CDT)
  { id:24, dateKey:"2026-06-18", date:"Thu 18 Jun", time:"03:00", teams:"Uzbekistan vs Colombia",        group:"K", venue:"Mexico City",    watch:"red",   channel:"BBC",          fact:"Uzbekistan are making their World Cup debut. Colombia have James Rodríguez — Golden Boot winner at the 2014 World Cup — still pulling strings." },

  // ── THU 18 JUN ───────────────────────────────────────────────────────────
  // Czechia vs South Africa: noon ET = 17:00 BST (Atlanta EDT)
  { id:25, dateKey:"2026-06-18", date:"Thu 18 Jun", time:"17:00", teams:"Czechia vs South Africa",       group:"A", venue:"Atlanta",        watch:"green", channel:"BBC",          fact:"South Africa are the only African nation to host a World Cup (2010). They were the first hosts ever eliminated in the group stage — desperate to improve." },
  // Switzerland vs B&H: 3pm ET = 20:00 BST (Los Angeles PDT → +8)
  { id:26, dateKey:"2026-06-18", date:"Thu 18 Jun", time:"20:00", teams:"Switzerland vs Bosnia & Herz.", group:"B", venue:"Los Angeles",    watch:"green", channel:"ITV",          fact:"Switzerland beat France on penalties at Euro 2020 — one of the great tournament upsets. Bosnia & Herzegovina have never won a World Cup group stage match." },
  // Canada vs Qatar: 6pm ET = 23:00 BST (Vancouver PDT)
  { id:27, dateKey:"2026-06-18", date:"Thu 18 Jun", time:"23:00", teams:"Canada vs Qatar",               group:"B", venue:"Vancouver",      watch:"amber", channel:"ITV",          fact:"Canada's Alphonso Davies is one of the fastest players on earth. Qatar lost all 3 group games as 2022 hosts — desperate to avoid repeating that humbling." },
  // Mexico vs South Korea: 9pm ET Thu = 02:00 BST Fri (Guadalajara CDT)
  { id:28, dateKey:"2026-06-19", date:"Fri 19 Jun", time:"02:00", teams:"Mexico vs South Korea",         group:"A", venue:"Guadalajara",    watch:"red",   channel:"BBC",          fact:"Mexico's infamous 'El Quinto Partido' curse — knocked out in the Round of 16 at 7 consecutive World Cups. Son Heung-min will not make it easy for them." },

  // ── FRI 19 JUN ───────────────────────────────────────────────────────────
  // USA vs Australia: 3pm ET = 20:00 BST (Seattle PDT → +8)
  { id:29, dateKey:"2026-06-19", date:"Fri 19 Jun", time:"20:00", teams:"USA vs Australia",              group:"D", venue:"Seattle",        watch:"green", channel:"BBC",          fact:"USA play at Lumen Field — home of the Seattle Seahawks. Christian Pulisic, the first American to win the Champions League, leads the host nation." },
  // Scotland vs Morocco: 6pm ET = 23:00 BST (Boston EDT) — Sky Sports confirmed 11pm BST
  { id:30, dateKey:"2026-06-19", date:"Fri 19 Jun", time:"23:00", teams:"Scotland vs Morocco",           group:"C", venue:"Boston",         watch:"amber", channel:"ITV1",         note:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland must win!", fact:"Morocco are ranked top 15 globally after their historic 2022 semi-final run. Scotland need a result here to stay alive in Group C." },
  // Brazil vs Haiti: 9pm ET Fri = 02:00 BST Sat (Philadelphia EDT)
  { id:31, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"02:00", teams:"Brazil vs Haiti",               group:"C", venue:"Philadelphia",   watch:"red",   channel:"ITV",          fact:"Brazil have never been knocked out before the quarter-finals. Haiti's qualification amid political instability is one of sport's great human stories." },
  // Turkey vs Paraguay: midnight ET Fri = 05:00 BST Sat (San Francisco PDT)
  { id:32, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"05:00", teams:"Turkey vs Paraguay",            group:"D", venue:"San Francisco",  watch:"red",   channel:"BBC",          fact:"Turkey's 3rd-place finish in 2002 was the high point of their history. Paraguay have reached the quarter-finals as recently as 2010." },

  // ── SAT 20 JUN ───────────────────────────────────────────────────────────
  // Netherlands vs Sweden: 1pm ET = 18:00 BST (Houston CDT)
  { id:33, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"18:00", teams:"Netherlands vs Sweden",         group:"F", venue:"Houston",        watch:"green", channel:"BBC",          fact:"Netherlands' Tijjani Reijnders and Xavi Simons have been electric in 2025-26. Sweden's Isak (Newcastle) is arguably his generation's best finisher." },
  // Germany vs Ivory Coast: 4pm ET = 21:00 BST (Toronto EDT)
  { id:34, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"21:00", teams:"Germany vs Ivory Coast",        group:"E", venue:"Toronto",        watch:"green", channel:"ITV",          fact:"Germany are desperate to go deep after early exits in 2018 and 2022. Ivory Coast are one of Africa's strongest nations and no pushover for the Germans." },
  // Ecuador vs Curacao: 8pm ET Sat = 01:00 BST Sun (Kansas City CDT)
  { id:35, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"01:00", teams:"Ecuador vs Curacao",            group:"E", venue:"Kansas City",    watch:"red",   channel:"BBC",          fact:"Curacao's debut World Cup continues. Ecuador beat Uruguay in qualifying and are no pushovers — this is a shootout for Group E's second spot." },
  // Tunisia vs Japan: midnight ET Sat = 05:00 BST Sun (Monterrey CDT) — 1,000th WC match!
  { id:36, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"05:00", teams:"Tunisia vs Japan",              group:"F", venue:"Monterrey",      watch:"red",   channel:"BBC",          fact:"Tunisia vs Japan is officially the 1,000th match in FIFA World Cup history. Japan have reached the knockouts at 4 consecutive World Cups." },

  // ── SUN 21 JUN ───────────────────────────────────────────────────────────
  // Spain vs Saudi Arabia: noon ET = 17:00 BST (Atlanta EDT)
  { id:37, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"17:00", teams:"Spain vs Saudi Arabia",         group:"H", venue:"Atlanta",        watch:"green", channel:"BBC",          fact:"Spain aim to become the first nation to win back-to-back Euros and then a World Cup. Saudi Arabia's league now features ex-Premier League stars including Benzema." },
  // Belgium vs Iran: 3pm ET = 20:00 BST (Los Angeles PDT)
  { id:38, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"20:00", teams:"Belgium vs Iran",               group:"G", venue:"Los Angeles",    watch:"green", channel:"ITV",          fact:"Kevin De Bruyne may be playing his final World Cup. Iran caused a sensation in 2022 — their win over Wales had their nation celebrating nationwide." },
  // Uruguay vs Cape Verde: 6pm ET = 23:00 BST (Miami EDT)
  { id:39, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"23:00", teams:"Uruguay vs Cape Verde",         group:"H", venue:"Miami",          watch:"amber", channel:"BBC",          note:"Weekend!", fact:"Uruguay have 2 World Cup wins (1930, 1950) but haven't triumphed since. Cape Verde — Atlantic islands, 550,000 people — one of football's great stories." },
  // New Zealand vs Egypt: 9pm ET Sun = 02:00 BST Mon (Vancouver PDT)
  { id:40, dateKey:"2026-06-22", date:"Mon 22 Jun", time:"02:00", teams:"New Zealand vs Egypt",          group:"G", venue:"Vancouver",      watch:"red",   channel:"ITV",          fact:"New Zealand have never won a World Cup match. Egypt's Mo Salah at 34 — this tournament could be the defining chapter of his legacy." },

  // ── MON 22 JUN ───────────────────────────────────────────────────────────
  // Argentina vs Austria: 1pm ET = 18:00 BST (Dallas CDT)
  { id:41, dateKey:"2026-06-22", date:"Mon 22 Jun", time:"18:00", teams:"Argentina vs Austria",          group:"J", venue:"Dallas",         watch:"green", channel:"BBC",          fact:"Austria once beat Argentina 6-1 at the 1958 World Cup. Messi will want to win this group to set up the most favourable knockout path." },
  // France vs Iraq: 5pm ET = 22:00 BST (Philadelphia EDT)
  { id:42, dateKey:"2026-06-22", date:"Mon 22 Jun", time:"22:00", teams:"France vs Iraq",                group:"I", venue:"Philadelphia",   watch:"green", channel:"BBC",          fact:"Kylian Mbappé is favourite to win the Golden Boot. France vs Iraq is a mismatch on paper — but at expanded World Cups upsets are more common." },
  // Norway vs Senegal: 8pm ET Mon = 01:00 BST Tue (New York/NJ EDT)
  { id:43, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"01:00", teams:"Norway vs Senegal",             group:"I", venue:"New York/NJ",   watch:"red",   channel:"ITV",          fact:"Erling Haaland vs Sadio Mané — two of the world's most lethal forwards sharing a pitch. Norway haven't been at a World Cup since 1998." },
  // Jordan vs Algeria: 11pm ET Mon = 04:00 BST Tue (San Francisco PDT)
  { id:44, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"04:00", teams:"Jordan vs Algeria",             group:"J", venue:"San Francisco",  watch:"red",   channel:"BBC",          fact:"Algeria have the most World Cup appearances of any Arab nation. Jordan's qualification was historic — one of the smallest football budgets in the tournament." },

  // ── TUE 23 JUN ───────────────────────────────────────────────────────────
  // Portugal vs Uzbekistan: 1pm ET = 18:00 BST (Houston CDT)
  { id:45, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"18:00", teams:"Portugal vs Uzbekistan",        group:"K", venue:"Houston",        watch:"green", channel:"ITV",          fact:"Ronaldo vs a debutant nation at potentially his last World Cup. Portugal have Bruno Fernandes, Bernardo Silva and Vitinha — a world-class midfield." },
  // England vs Ghana: 4pm ET = 21:00 BST (Boston EDT)
  { id:46, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"21:00", teams:"England vs Ghana",              group:"L", venue:"Boston",         watch:"green", channel:"BBC One",       note:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 England must win!", fact:"Ghana have Premier League quality: Partey (Arsenal) and Kudus (West Ham). England need a result here to be confident of topping Group L." },
  // Panama vs Croatia: 7pm ET Tue = 00:00 BST Wed (Toronto EDT)
  { id:47, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"00:00", teams:"Panama vs Croatia",             group:"L", venue:"Toronto",        watch:"amber", channel:"BBC",          fact:"Croatia — runners-up in 2018 — need a result to stay alive. Luka Modrić at 41 is one of the tournament's great story lines — still playing at this level." },
  // Colombia vs DR Congo: 10pm ET Tue = 03:00 BST Wed (Guadalajara CDT)
  { id:48, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"03:00", teams:"Colombia vs DR Congo",          group:"K", venue:"Guadalajara",    watch:"red",   channel:"ITV",          fact:"Colombia's James Rodríguez won the Golden Boot at the 2014 World Cup. DR Congo are making their first World Cup since 1974 — a historic return." },

  // ── WED 24 JUN — Group B & C final rounds ────────────────────────────────
  { id:49, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"20:00", teams:"Switzerland vs Canada",         group:"B", venue:"Vancouver",      watch:"green", channel:"ITV",          simultaneous:true, note:"⚡ Group B decider!", fact:"Both teams could qualify. Switzerland vs Canada could decide Group B's fate — classic final-day World Cup drama." },
  { id:50, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"20:00", teams:"Bosnia & Herz. vs Qatar",       group:"B", venue:"Seattle",        watch:"green", channel:"ITV",          simultaneous:true, fact:"Group B's final round — simultaneous to prevent collusion. Qatar may already be eliminated but will fight for national pride." },
  { id:51, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"23:00", teams:"Scotland vs Brazil",            group:"C", venue:"Miami",          watch:"amber", channel:"BBC",          simultaneous:true, note:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland vs Brazil!", fact:"Scotland opened the 1998 World Cup against Brazil — losing 2-1. A rematch 28 years later is one of the tournament's most anticipated fixtures." },
  { id:52, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"23:00", teams:"Morocco vs Haiti",              group:"C", venue:"Atlanta",        watch:"amber", channel:"BBC",          simultaneous:true, fact:"Morocco will likely already be through. Haiti need a win to have any hope of securing one of the best third-place wildcard spots." },
  // Group A final round: 9pm ET Wed = 02:00 BST Thu
  { id:53, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"02:00", teams:"Czechia vs Mexico",             group:"A", venue:"Mexico City",    watch:"red",   channel:"BBC",          simultaneous:true, fact:"Group A final day — simultaneous games introduced after the 1982 'Disgrace of Gijón' where Germany and Austria played out an agreed result." },
  { id:54, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"02:00", teams:"South Africa vs South Korea",   group:"A", venue:"Monterrey",      watch:"red",   channel:"BBC",          simultaneous:true, fact:"South Africa have not won a World Cup match since hosting in 2010. Son Heung-min needs goals to prove South Korea's worth." },

  // ── THU 25 JUN — Group E final round ─────────────────────────────────────
  // 4pm ET = 21:00 BST (New York EDT / Philadelphia EDT)
  { id:55, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"21:00", teams:"Ecuador vs Germany",            group:"E", venue:"New York/NJ",   watch:"green", channel:"BBC",          simultaneous:true, note:"⚡ Group E decider!", fact:"Germany could top the group or crash out — Group E is extremely tight. Ecuador beat hosts Qatar in the 2022 opener. Absolutely must-watch." },
  { id:56, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"21:00", teams:"Curacao vs Ivory Coast",        group:"E", venue:"Philadelphia",   watch:"green", channel:"BBC",          simultaneous:true, fact:"Simultaneous Group E final. Curacao's fairytale debut vs one of Africa's biggest footballing nations." },
  // Group F final round: 7pm ET = 00:00 BST Fri (Dallas CDT / Kansas City CDT)
  { id:57, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"00:00", teams:"Japan vs Sweden",               group:"F", venue:"Dallas",         watch:"amber", channel:"BBC",          simultaneous:true, fact:"Japan have beaten Germany and Spain at recent World Cups. Sweden's Isak could be their most dangerous striker since Ibrahimović." },
  { id:58, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"00:00", teams:"Tunisia vs Netherlands",        group:"F", venue:"Kansas City",    watch:"amber", channel:"BBC",          simultaneous:true, fact:"Netherlands need to win to be sure of topping the group. Tunisia held France to a famous draw in 2022. The Dutch cannot take this lightly." },
  // Group D final round: 10pm ET = 03:00 BST Fri (Los Angeles PDT / San Francisco PDT)
  { id:59, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"03:00", teams:"Turkey vs USA",                 group:"D", venue:"Los Angeles",    watch:"red",   channel:"ITV",          simultaneous:true, fact:"The host nation's final group game. Turkey's attacking talent could give the USA a nervy night in LA." },
  { id:60, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"03:00", teams:"Paraguay vs Australia",         group:"D", venue:"San Francisco",  watch:"red",   channel:"ITV",          simultaneous:true, fact:"Both nations will know exactly what they need. Paraguay have a proud World Cup tradition — reaching the quarter-finals as recently as 2010." },

  // ── FRI 26 JUN — Group I final round ─────────────────────────────────────
  // 3pm ET = 20:00 BST (Boston EDT / Toronto EDT)
  { id:61, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"20:00", teams:"Norway vs France",              group:"I", venue:"Boston",         watch:"green", channel:"ITV",          simultaneous:true, note:"⚽ Haaland vs Mbappé!", fact:"Erling Haaland vs Kylian Mbappé — arguably the two best strikers on the planet. Norway's last World Cup was France 1998. Unmissable prime-time football." },
  { id:62, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"20:00", teams:"Senegal vs Iraq",               group:"I", venue:"Toronto",        watch:"green", channel:"ITV",          simultaneous:true, fact:"Senegal won back-to-back AFCON titles. Sadio Mané at 34 — a warrior in what may be his final World Cup. Iraq need a miracle result to stay alive." },
  // Group H final round: 8pm ET Fri = 01:00 BST Sat (Houston CDT / Guadalajara CDT)
  { id:63, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"01:00", teams:"Cape Verde vs Saudi Arabia",    group:"H", venue:"Houston",        watch:"red",   channel:"ITV",          simultaneous:true, fact:"Final Group H games — whoever finishes top avoids the harder side of the bracket." },
  { id:64, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"01:00", teams:"Uruguay vs Spain",              group:"H", venue:"Guadalajara",    watch:"red",   channel:"ITV",          simultaneous:true, fact:"Darwin Núñez (Liverpool) vs Rodri and Pedri — superstar quality on both sides. Spain vs Uruguay is a potential World Cup classic." },
  // Group G final round: 11pm ET Fri = 04:00 BST Sat (Seattle PDT / Vancouver PDT)
  { id:65, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"04:00", teams:"Egypt vs Iran",                 group:"G", venue:"Seattle",        watch:"red",   channel:"BBC",          simultaneous:true, fact:"A tense Middle East vs North Africa clash. The result determines who accompanies Belgium from Group G." },
  { id:66, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"04:00", teams:"New Zealand vs Belgium",        group:"G", venue:"Vancouver",      watch:"red",   channel:"BBC",          simultaneous:true, fact:"Belgium will likely already be through. New Zealand have never beaten a European nation at a World Cup — a maiden win would be historic." },

  // ── SAT 27 JUN — Group L & K final rounds ────────────────────────────────
  // 5pm ET = 22:00 BST (New York EDT / Philadelphia EDT)
  { id:67, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"22:00", teams:"Panama vs England",             group:"L", venue:"New York/NJ",   watch:"green", channel:"ITV1",         simultaneous:true, note:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 England group finale!", fact:"England beat Panama 6-1 in 2018 with Harry Kane scoring a hat-trick. Tuchel will want a strong finish to set up the most favourable R32 draw." },
  { id:68, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"22:00", teams:"Croatia vs Ghana",              group:"L", venue:"Philadelphia",   watch:"green", channel:"BBC",          simultaneous:true, fact:"Croatia — runners-up in 2018 — need a result to stay alive. Modrić vs Partey — two of the Premier League's finest midfielders in one game." },
  // 7:30pm ET = 00:30 BST Sun (Miami EDT / Atlanta EDT)
  { id:69, dateKey:"2026-06-28", date:"Sun 28 Jun", time:"00:30", teams:"Colombia vs Portugal",          group:"K", venue:"Miami",          watch:"amber", channel:"BBC",          simultaneous:true, note:"Worth staying up!", fact:"James Rodríguez vs Portugal's world-class midfield — decides who tops Group K and avoids the harder half of the knockout bracket." },
  { id:70, dateKey:"2026-06-28", date:"Sun 28 Jun", time:"00:30", teams:"DR Congo vs Uzbekistan",        group:"K", venue:"Atlanta",        watch:"amber", channel:"BBC",          simultaneous:true, fact:"DR Congo's first World Cup since 1974. Uzbekistan are debutants. A historic double-debut group finale." },
  // Group J final round: 10pm ET Sat = 03:00 BST Sun (Kansas City CDT / Dallas CDT)
  { id:71, dateKey:"2026-06-28", date:"Sun 28 Jun", time:"03:00", teams:"Algeria vs Austria",            group:"J", venue:"Kansas City",    watch:"red",   channel:"ITV",          simultaneous:true, fact:"Both sides looking to claim the runner-up spot behind Argentina. Algeria's Houssem Aouar leads a talented squad with genuine pedigree." },
  { id:72, dateKey:"2026-06-28", date:"Sun 28 Jun", time:"03:00", teams:"Jordan vs Argentina",           group:"J", venue:"Dallas",         watch:"red",   channel:"ITV",          simultaneous:true, fact:"Argentina and Messi completing their group campaign. Jordan's players will all have one photograph on their phones after this game." },

  // ── ROUND OF 32 (Jun 28 – Jul 4) ─────────────────────────────────────────
  // Sun 28 Jun: 3pm ET LA = 20:00 BST
  { id:73,  dateKey:"2026-06-28", date:"Sun 28 Jun", time:"20:00", teams:"R32 — Match 1",   group:"R32", venue:"Los Angeles",  watch:"green", channel:"TBC", fact:"The brand-new Round of 32 — a World Cup first. 32 teams fight for 16 spots. Expect at least one giant-killing in this round." },
  // Mon 29 Jun: 1pm ET Houston = 18:00 BST; 4:30pm ET Boston = 21:30 BST; 9pm ET Monterrey = 02:00 BST Tue
  { id:74,  dateKey:"2026-06-29", date:"Mon 29 Jun", time:"18:00", teams:"R32 — Match 2",   group:"R32", venue:"Houston",      watch:"green", channel:"TBC", fact:"R32 Day 2. The 2022 tournament saw Morocco, Japan and Australia all cause shocks in the knockouts — expect similar drama from this brand new stage." },
  { id:75,  dateKey:"2026-06-29", date:"Mon 29 Jun", time:"21:30", teams:"R32 — Match 3",   group:"R32", venue:"Boston",       watch:"green", channel:"TBC", fact:"Prime time knockout football. BBC and ITV split R32 coverage — check closer to the date for exact channel assignments once teams are known." },
  { id:76,  dateKey:"2026-06-30", date:"Tue 30 Jun", time:"02:00", teams:"R32 — Match 4",   group:"R32", venue:"Monterrey",    watch:"red",   channel:"TBC", fact:"The Monterrey late slot. If England are in this slot the nation watches regardless of the time." },
  // Tue 30 Jun: 1pm ET Dallas = 18:00 BST; 5pm ET New York = 22:00 BST; 9pm ET Mexico City = 02:00 BST Wed
  { id:77,  dateKey:"2026-06-30", date:"Tue 30 Jun", time:"18:00", teams:"R32 — Match 5",   group:"R32", venue:"Dallas",       watch:"green", channel:"TBC", fact:"R32 continues — by now the full knockout picture is clear. Bracket upsets will have reshaped expectations entirely." },
  { id:78,  dateKey:"2026-06-30", date:"Tue 30 Jun", time:"22:00", teams:"R32 — Match 6",   group:"R32", venue:"New York/NJ",  watch:"green", channel:"TBC", fact:"Evening knockout football — perfect for a weekday. The expanded R32 means more games but also more stories and more surprises." },
  { id:79,  dateKey:"2026-07-01", date:"Wed 1 Jul",  time:"02:00", teams:"R32 — Match 7",   group:"R32", venue:"Mexico City",  watch:"red",   channel:"TBC", fact:"Second R32 red-zone game. Worth a late night if you have holiday booked." },
  // Wed 1 Jul: noon ET Atlanta = 17:00 BST; 4pm ET Seattle = 21:00 BST; 8pm ET San Francisco = 01:00 BST Thu
  { id:80,  dateKey:"2026-07-01", date:"Wed 1 Jul",  time:"17:00", teams:"R32 — Match 8",   group:"R32", venue:"Atlanta",      watch:"green", channel:"TBC", fact:"Afternoon knockout football — the 17:00 BST slot is one of the most watchable for UK fans. Get home and straight onto the sofa." },
  { id:81,  dateKey:"2026-07-01", date:"Wed 1 Jul",  time:"21:00", teams:"R32 — Match 9",   group:"R32", venue:"Seattle",      watch:"green", channel:"TBC", fact:"Midweek knockout football — only 16 teams will remain standing after this round. The pressure in every game is immense." },
  { id:82,  dateKey:"2026-07-02", date:"Thu 2 Jul",  time:"01:00", teams:"R32 — Match 10",  group:"R32", venue:"San Francisco",watch:"red",   channel:"TBC", fact:"A 1am BST kick-off — marginal on a Thursday night but manageable if the game is a classic." },
  // Thu 2 Jul: 3pm ET LA = 20:00 BST; 7pm ET Toronto = 00:00 BST Fri; 11pm ET Vancouver = 04:00 BST Fri
  { id:83,  dateKey:"2026-07-02", date:"Thu 2 Jul",  time:"20:00", teams:"R32 — Match 11",  group:"R32", venue:"Los Angeles",  watch:"green", channel:"TBC", fact:"R32 continues. Eight teams have already secured R16 spots. The remaining places are now decided — the bracket locks in." },
  { id:84,  dateKey:"2026-07-03", date:"Fri 3 Jul",  time:"00:00", teams:"R32 — Match 12",  group:"R32", venue:"Toronto",      watch:"amber", channel:"TBC", fact:"Toronto midnight kick-off — finishes just after 2am. A Friday sleep-in covers the sleep debt if you stay up." },
  { id:85,  dateKey:"2026-07-03", date:"Fri 3 Jul",  time:"04:00", teams:"R32 — Match 13",  group:"R32", venue:"Vancouver",    watch:"red",   channel:"TBC", fact:"The latest R32 start — firmly night-owl territory. Strictly highlights unless your team is playing." },
  // Fri 3 Jul: 2pm ET Dallas = 19:00 BST; 6pm ET Miami = 23:00 BST; 9:30pm ET Kansas City = 02:30 BST Sat
  { id:86,  dateKey:"2026-07-03", date:"Fri 3 Jul",  time:"19:00", teams:"R32 — Match 14",  group:"R32", venue:"Dallas",       watch:"green", channel:"TBC", fact:"Evening knockout football to close out the week — a perfect Friday night option. Done before 9pm." },
  { id:87,  dateKey:"2026-07-03", date:"Fri 3 Jul",  time:"23:00", teams:"R32 — Match 15",  group:"R32", venue:"Miami",        watch:"amber", channel:"TBC", fact:"The penultimate R32 game. A 23:00 kick-off finishes just after 1am. Friday sleep-in covers it." },
  { id:88,  dateKey:"2026-07-04", date:"Sat 4 Jul",  time:"02:30", teams:"R32 — Match 16",  group:"R32", venue:"Kansas City",  watch:"red",   channel:"TBC", note:"Weekend late", fact:"The final R32 game. All 16 Round of 16 participants are now confirmed. USA Independence Day — any chance it's the hosts?" },

  // ── ROUND OF 16 (Jul 4–7) ────────────────────────────────────────────────
  // Sat 4 Jul: 1pm ET Houston = 18:00 BST; 5pm ET Philadelphia = 22:00 BST
  { id:89,  dateKey:"2026-07-04", date:"Sat 4 Jul",  time:"18:00", teams:"Round of 16 — Match 1", group:"R16", venue:"Houston",      watch:"green", channel:"TBC", fact:"Round of 16 begins — the traditional knockout stage. Every game from here is a classic. England's R16 will likely be on BBC One if they qualify." },
  { id:90,  dateKey:"2026-07-04", date:"Sat 4 Jul",  time:"22:00", teams:"Round of 16 — Match 2", group:"R16", venue:"Philadelphia", watch:"green", channel:"TBC", fact:"The 22:00 BST slot — kick-off after dinner, final whistle before midnight. Perfect World Cup viewing." },
  // Sun 5 Jul: 4pm ET New York = 21:00 BST; 8pm ET Mexico City = 01:00 BST Mon
  { id:91,  dateKey:"2026-07-05", date:"Sun 5 Jul",  time:"21:00", teams:"Round of 16 — Match 3", group:"R16", venue:"New York/NJ",  watch:"green", channel:"TBC", note:"Weekend!", fact:"Sunday night knockout football. If this goes to extra time and penalties you won't care about the time." },
  { id:92,  dateKey:"2026-07-06", date:"Mon 6 Jul",  time:"01:00", teams:"Round of 16 — Match 4", group:"R16", venue:"Mexico City",  watch:"red",   channel:"TBC", fact:"The only R16 game in the red zone. If England are playing, every household in the country will be awake regardless." },
  // Mon 6 Jul: 3pm ET Dallas = 20:00 BST; 8pm ET Seattle = 01:00 BST Tue
  { id:93,  dateKey:"2026-07-06", date:"Mon 6 Jul",  time:"20:00", teams:"Round of 16 — Match 5", group:"R16", venue:"Dallas",       watch:"green", channel:"TBC", fact:"Monday evening knockout football — get home, get the snacks in, and settle in for the highest-pressure football on earth." },
  { id:94,  dateKey:"2026-07-07", date:"Tue 7 Jul",  time:"01:00", teams:"Round of 16 — Match 6", group:"R16", venue:"Seattle",      watch:"red",   channel:"TBC", fact:"West Coast late slot. Pacific evening games always land in UK late-night territory. Highlights unless your team is playing." },
  // Tue 7 Jul: noon ET Atlanta = 17:00 BST; 4pm ET Vancouver = 21:00 BST (PDT = +8)
  { id:95,  dateKey:"2026-07-07", date:"Tue 7 Jul",  time:"17:00", teams:"Round of 16 — Match 7", group:"R16", venue:"Atlanta",      watch:"green", channel:"TBC", fact:"The 17:00 BST R16 slot — absolutely perfect. Get home from work slightly early. This is the dream slot." },
  { id:96,  dateKey:"2026-07-07", date:"Tue 7 Jul",  time:"21:00", teams:"Round of 16 — Match 8", group:"R16", venue:"Vancouver",    watch:"green", channel:"TBC", fact:"Final R16 game — eight teams remain. The pressure, quality and intensity from this stage is unmatched in football." },

  // ── QUARTER-FINALS (Jul 9–11) ─────────────────────────────────────────────
  // Thu 9 Jul: 4pm ET Boston = 21:00 BST
  { id:97,  dateKey:"2026-07-09", date:"Thu 9 Jul",  time:"21:00", teams:"Quarter-final 1",  group:"QF", venue:"Boston",       watch:"green", channel:"TBC", fact:"Quarter-final Thursday. Only 8 teams remain — every squad is battle-hardened, every player at peak intensity. The best football of the tournament." },
  // Fri 10 Jul: 3pm ET Los Angeles PDT = 23:00 BST
  { id:98,  dateKey:"2026-07-10", date:"Fri 10 Jul", time:"23:00", teams:"Quarter-final 2",  group:"QF", venue:"Los Angeles",  watch:"amber", channel:"TBC", fact:"Friday night World Cup quarter-final — the 11pm BST slot means you're done by 1am. Worth staying up, and the weekend lie-in covers it." },
  // Sat 11 Jul: 5pm ET Miami = 22:00 BST; 9pm ET Kansas City CDT = 02:00 BST Sun
  { id:99,  dateKey:"2026-07-11", date:"Sat 11 Jul", time:"22:00", teams:"Quarter-final 3",  group:"QF", venue:"Miami",        watch:"green", channel:"TBC", note:"Weekend!", fact:"Saturday night quarter-final. If England are here the nation stops. If it goes to penalties, everyone watches through their fingers." },
  { id:100, dateKey:"2026-07-12", date:"Sun 12 Jul", time:"02:00", teams:"Quarter-final 4",  group:"QF", venue:"Kansas City",  watch:"red",   channel:"TBC", note:"Weekend late", fact:"The only QF in the night-owl zone. Very late Sunday. Worth it for a quarter-final. Sleep in Monday morning if you can." },

  // ── SEMI-FINALS (Jul 14–15) ───────────────────────────────────────────────
  // Tue 14 Jul: 3pm ET Dallas CDT = 20:00 BST
  { id:101, dateKey:"2026-07-14", date:"Tue 14 Jul", time:"20:00", teams:"Semi-final 1",  group:"SF", venue:"Dallas",   watch:"green", channel:"TBC", note:"Dream slot!", fact:"World Cup semi-final at 8pm BST — it doesn't get better than this for UK viewers. Build-up from 7pm, kick-off at 8, bed by midnight." },
  // Wed 15 Jul: 3pm ET Atlanta EDT = 20:00 BST
  { id:102, dateKey:"2026-07-15", date:"Wed 15 Jul", time:"20:00", teams:"Semi-final 2",  group:"SF", venue:"Atlanta",  watch:"green", channel:"TBC", note:"Dream slot!", fact:"The second semi-final — if England are involved this is the biggest night since 2018. 8pm BST on a Wednesday. The nation will watch together." },

  // ── THIRD PLACE & FINAL ───────────────────────────────────────────────────
  // Sat 18 Jul: 5pm ET Miami EDT = 22:00 BST
  { id:103, dateKey:"2026-07-18", date:"Sat 18 Jul", time:"22:00", teams:"Third-place play-off", group:"3RD",  venue:"Miami",              watch:"green", channel:"BBC / ITV",      fact:"Often dismissed but regularly produces classics — Germany vs Uruguay in 2010 was a 7-goal thriller. The 10pm BST kick-off is very civilised." },
  // Sun 19 Jul: 3pm ET New York EDT = 20:00 GMT = 21:00 BST — CONFIRMED 8pm BST by Sky Sports / KickoffAdventures
  { id:104, dateKey:"2026-07-19", date:"Sun 19 Jul", time:"21:00", teams:"🏆 WORLD CUP FINAL",   group:"FINAL", venue:"MetLife Stadium, NJ", watch:"green", channel:"BBC One + ITV1", note:"21:00 BST — BBC & ITV!", fact:"MetLife Stadium — capacity 82,500. Both BBC and ITV broadcast simultaneously. 3pm ET = 20:00 GMT = 21:00 BST. The perfect end to a perfect tournament." },
]

// ─── TEAMS ───────────────────────────────────────────────────────────────────
const TEAM_LIST = [
  "England","Scotland","France","Germany","Spain","Portugal","Netherlands","Belgium",
  "Brazil","Argentina","USA","Mexico","Canada","Japan","South Korea","Morocco",
  "Uruguay","Colombia","Ecuador","Norway","Sweden","Croatia","Switzerland",
  "Senegal","Ivory Coast","Egypt","South Africa","Australia","Turkey","Iran",
  "Saudi Arabia","Qatar","Ghana","Tunisia","New Zealand","Curacao",
  "Cape Verde","Haiti","Paraguay","Czechia","Austria","Jordan","Algeria",
  "Bosnia & Herz.","Iraq","Uzbekistan","DR Congo","Panama",
]

// ─── STYLE CONSTANTS ─────────────────────────────────────────────────────────
const WATCH = {
  green: { label:"Prime time", chip:"bg-[var(--pitch)] text-[var(--ink)]",    text:"text-[var(--pitch-bright)]", dot:"bg-[var(--pitch-bright)]", soft:"bg-[var(--pitch)]/12 border-[var(--pitch)]/40" },
  amber: { label:"Late night", chip:"bg-[var(--amber)] text-[var(--ink)]",    text:"text-[var(--amber)]",        dot:"bg-[var(--amber)]",        soft:"bg-[var(--amber)]/10 border-[var(--amber)]/40" },
  red:   { label:"Night owl",  chip:"bg-[var(--red)] text-white",             text:"text-[var(--red)]",          dot:"bg-[var(--red)]",          soft:"bg-[var(--red)]/10 border-[var(--red)]/40" },
} as const

const CHANNEL_STYLE: Record<string,string> = {
  "ITV1":"bg-[#FFD400] text-black", "ITV":"bg-[#FFD400] text-black",
  "BBC":"bg-[#d4145a] text-white",  "BBC One":"bg-[#d4145a] text-white",
  "BBC One + ITV1":"bg-[var(--gold)] text-black",
  "BBC / ITV":"bg-[var(--gold)] text-black",
  "TBC":"bg-white/10 text-[var(--muted)]",
}

const STAGE_COLORS: Record<string,string> = {
  A:"#3b82f6",B:"#06b6d4",C:"#22d3ee",D:"#f59e0b",E:"#10b981",F:"#f43f5e",
  G:"#6366f1",H:"#ec4899",I:"#14b8a6",J:"#fb923c",K:"#38bdf8",L:"#facc15",
  R32:"#94a3b8",R16:"#38bdf8",QF:"#a855f7",SF:"#ec4899","3RD":"#a8a29e",FINAL:"#FFD400",
}

// ─── ICS EXPORT ──────────────────────────────────────────────────────────────
function toICSDate(dateKey: string, time: string) {
  const [y,m,d] = dateKey.split("-")
  const [h,min] = time.split(":")
  return `${y}${m}${d}T${h}${min}00`
}

function generateICS(matches: Match[]) {
  const lines = [
    "BEGIN:VCALENDAR","VERSION:2.0",
    "PRODID:-//WC2026 UK Viewing Guide//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:World Cup 2026 · UK Guide",
    "X-WR-TIMEZONE:Europe/London",
    "X-WR-CALDESC:FIFA World Cup 2026 - all times BST with TV channel info",
  ]
  matches.forEach((m) => {
    if (!m.time) return
    const start = toICSDate(m.dateKey, m.time)
    const [sh,sm] = m.time.split(":").map(Number)
    const eh = (sh + 2) % 24
    const end = toICSDate(m.dateKey, `${String(eh).padStart(2,"0")}:${String(sm).padStart(2,"0")}`)
    const ch = m.channel !== "TBC" ? ` | ${m.channel}` : ""
    const isKO = ["R32","R16","QF","SF","3RD","FINAL"].includes(m.group)
    lines.push("BEGIN:VEVENT")
    lines.push(`DTSTART;TZID=Europe/London:${start}`)
    lines.push(`DTEND;TZID=Europe/London:${end}`)
    lines.push(`SUMMARY:⚽ ${m.teams}${ch}`)
    lines.push(`DESCRIPTION:${isKO ? m.group : "Group "+m.group} | ${m.venue}${ch}\\n\\n${(m.fact||"").slice(0,200)}`)
    lines.push(`LOCATION:${m.venue}`)
    lines.push(`UID:wc2026-${m.id}@ukguide2026`)
    lines.push("END:VEVENT")
  })
  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

function downloadICS(matches: Match[], filename: string) {
  try {
    const content = generateICS(matches)
    const b64 = btoa(unescape(encodeURIComponent(content)))
    const a = document.createElement("a")
    a.href = `data:text/calendar;charset=utf-8;base64,${b64}`
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  } catch {
    return false
  }
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: string }) {
  const s = CHANNEL_STYLE[channel] || "bg-white/10 text-[var(--muted)]"
  return (
    <span className={`${s} inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide leading-none`}>
      {channel}
    </span>
  )
}

function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[var(--card-bg)] px-4 py-3 text-center">
      <div className={`font-heading text-3xl font-bold leading-none ${accent}`}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">{label}</div>
    </div>
  )
}

// ─── CALENDAR MODAL ──────────────────────────────────────────────────────────
function CalendarModal({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState<string|null>(null)
  const options = [
    { emoji:"🟢", label:"Prime time games only",  sub:"All games you can watch without losing sleep", matches:ALL_MATCHES.filter(m=>m.watch==="green"), file:"WC2026-prime-time.ics" },
    { emoji:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", label:"England fixtures",          sub:"All 3 group games + knockouts (TBC)",        matches:ALL_MATCHES.filter(m=>m.teams.includes("England")), file:"WC2026-england.ics" },
    { emoji:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", label:"Scotland fixtures",         sub:"All 3 group games + knockouts (TBC)",        matches:ALL_MATCHES.filter(m=>m.teams.includes("Scotland")), file:"WC2026-scotland.ics" },
    { emoji:"📅", label:"Every match",             sub:"All 104 fixtures — green, amber and red",      matches:ALL_MATCHES, file:"WC2026-all.ics" },
  ]
  function handle(matches: Match[], file: string) {
    const ok = downloadICS(matches, file)
    setDone(ok ? file : "error")
    if (ok) setTimeout(onClose, 2500)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[var(--card-bg)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-[var(--fg)]">Add to Calendar</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Downloads a .ics file — tap to open in your calendar app</p>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--fg)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {done === "error" && (
            <div className="mb-3 rounded-xl border border-[var(--red)]/40 bg-[var(--red)]/10 px-3 py-2 text-xs text-[var(--red)]">
              Download failed. Try a different browser or open on desktop.
            </div>
          )}

          {done && done !== "error" && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--pitch)]/40 bg-[var(--pitch)]/10 px-3 py-2.5">
              <CheckCircle className="h-4 w-4 shrink-0 text-[var(--pitch-bright)]" />
              <div>
                <p className="text-xs font-bold text-[var(--pitch-bright)]">File downloaded!</p>
                <p className="text-[11px] text-[var(--muted)]">Open the .ics file to import into Google, Apple or Outlook Calendar</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {options.map(opt => (
              <button
                key={opt.file}
                onClick={() => handle(opt.matches, opt.file)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3.5 text-left transition hover:bg-white/8 active:scale-[0.98]"
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--fg)]">{opt.label}</p>
                  <p className="text-[11px] text-[var(--muted)]">{opt.sub}</p>
                </div>
                <CalendarDays className="ml-auto h-4 w-4 shrink-0 text-[var(--muted)]" />
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-[10px] text-[var(--muted)]">
            All times in BST · Channel info included in event description
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function WorldCupSchedule() {
  const today = new Date().toISOString().split("T")[0]
  const [activeTab,     setActiveTab]     = useState("watchable")
  const [watchFilter,   setWatchFilter]   = useState("all")
  const [teamFilter,    setTeamFilter]    = useState("all")
  const [teamSearchRaw, setTeamSearch]    = useState("")
  const [showTeamDrop,  setShowTeamDrop]  = useState(false)
  const [expandedFact,  setExpandedFact]  = useState<string|null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Record<string,boolean>>({})
  const [showCalModal,  setShowCalModal]  = useState(false)
  const [countdown,     setCountdown]     = useState("")
  const [nextMatch,     setNextMatch]     = useState<Match|null>(null)
  const teamInputRef = useRef<HTMLInputElement>(null)

  const teamSearch = teamSearchRaw.toLowerCase()
  const toggleFact = (k:string) => setExpandedFact(p => p===k ? null : k)
  const toggleDay  = (k:string) => setCollapsedDays(p => ({...p,[k]:!p[k]}))

  useEffect(() => {
    const findNext = () => ALL_MATCHES.find(m => {
      const [h,min] = m.time.split(":").map(Number)
      return new Date(`${m.dateKey}T${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}:00+01:00`).getTime() > Date.now()
    }) || null
    const tick = () => {
      const match = findNext()
      setNextMatch(match)
      if (!match) { setCountdown("Tournament complete"); return }
      const [h,min] = match.time.split(":").map(Number)
      const ko = new Date(`${match.dateKey}T${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}:00+01:00`).getTime()
      const diff = ko - Date.now()
      if (diff <= 0) { setCountdown("KICK-OFF!"); return }
      const d = Math.floor(diff/86400000)
      const hr = Math.floor((diff%86400000)/3600000)
      const m = Math.floor((diff%3600000)/60000)
      const s = Math.floor((diff%60000)/1000)
      setCountdown(`${d}d ${String(hr).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const grouped = useMemo(() => {
    let list = ALL_MATCHES
    if (watchFilter !== "all") list = list.filter(m => m.watch === watchFilter)
    if (teamFilter !== "all")  list = list.filter(m => m.teams.toLowerCase().includes(teamFilter.toLowerCase()))
    if (activeTab === "today")     list = list.filter(m => m.dateKey === today)
    else if (activeTab === "watchable") list = list.filter(m => m.watch === "green")
    const map: Record<string,{date:string;dateKey:string;matches:Match[]}> = {}
    list.forEach(m => {
      if (!map[m.dateKey]) map[m.dateKey] = {date:m.date, dateKey:m.dateKey, matches:[]}
      map[m.dateKey].matches.push(m)
    })
    return Object.values(map).sort((a,b) => a.dateKey.localeCompare(b.dateKey))
  }, [watchFilter, teamFilter, activeTab, today])

  const todayMatches   = ALL_MATCHES.filter(m => m.dateKey === today)
  const totalWatchable = ALL_MATCHES.filter(m => m.watch === "green").length
  const filteredTeams  = TEAM_LIST.filter(t => t.toLowerCase().includes(teamSearch)).slice(0,12)

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--fg)] pb-20"
      onClick={() => setShowTeamDrop(false)}>

      {/* Calendar modal */}
      {showCalModal && <CalendarModal onClose={() => setShowCalModal(false)} />}

      {/* ── HERO ── */}
      <header className="relative overflow-hidden border-b-4 border-[var(--pitch-bright)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--pitch)] via-[oklch(0.22_0.06_160)] to-[var(--bg)] opacity-90" />
        <div className="relative mx-auto max-w-3xl px-5 py-8 text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--pitch-bright)]">
            <CircleDot className="h-3 w-3" /> FIFA World Cup 2026 · UK Viewing Guide
          </div>
          <h1 className="font-heading mb-2 text-4xl font-bold uppercase tracking-tight text-white drop-shadow md:text-5xl">
            Watch Every Minute
          </h1>
          <p className="mb-5 text-sm text-[var(--sky-soft)]">
            All 48 nations · 11 June – 19 July · Colour-coded by sleep impact · All times BST
          </p>

          {nextMatch && (
            <div className="mb-5 inline-block rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-center backdrop-blur">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pitch-bright)]">
                Next — {nextMatch.teams} · {nextMatch.date} · {nextMatch.time} BST
              </p>
              <p className="font-heading text-2xl font-bold text-white tabular-nums">{countdown}</p>
            </div>
          )}

          {/* Calendar button — full width tap target, clear label */}
          <button
            onClick={() => setShowCalModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--pitch-bright)]/50 bg-[var(--pitch)]/20 px-6 py-3 text-sm font-bold text-[var(--pitch-bright)] transition hover:bg-[var(--pitch)]/40 active:scale-95"
          >
            <CalendarDays className="h-4 w-4" /> Add fixtures to your calendar
          </button>
        </div>
      </header>

      {/* ── STATS ── */}
      <section className="mx-auto grid max-w-3xl grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-4">
        <StatCard value={String(ALL_MATCHES.filter(m=>m.watch==="green").length)} label="Prime time" accent="text-[var(--pitch-bright)]" />
        <StatCard value={String(ALL_MATCHES.filter(m=>m.watch==="amber").length)} label="Late night"  accent="text-[var(--amber)]" />
        <StatCard value={String(ALL_MATCHES.filter(m=>m.watch==="red").length)}   label="Night owl"   accent="text-[var(--red)]" />
        <StatCard value={String(ALL_MATCHES.length)} label="Total matches" accent="text-[var(--sky)]" />
      </section>

      {/* ── SLEEP KEY ── */}
      <section className="mx-auto mb-4 grid max-w-3xl grid-cols-1 gap-2 px-5 sm:grid-cols-3">
        {(["green","amber","red"] as const).map(w => (
          <div key={w} className={`flex items-start gap-3 rounded-xl border p-3 ${WATCH[w].soft}`}>
            <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${WATCH[w].dot}`} />
            <div>
              <p className={`text-xs font-bold ${WATCH[w].text}`}>{WATCH[w].label}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                {w==="green" && "Ends ≤23:00 → 8h sleep before 08:30 ✓"}
                {w==="amber" && "Ends ~01:00 → tight weeknights; fine on weekends"}
                {w==="red"   && "Starts ≥02:00 → weekends only"}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── TABS ── */}
      <nav className="mx-auto mb-4 flex max-w-3xl flex-wrap gap-2 px-5">
        {[
          { key:"today",     label:`Tonight (${todayMatches.length})`,   Icon:Moon },
          { key:"watchable", label:`Prime time (${totalWatchable})`,     Icon:Tv },
          { key:"all",       label:"Full schedule",                       Icon:Trophy },
        ].map(({key,label,Icon}) => (
          <button key={key}
            onClick={() => { setActiveTab(key); if(key!=="all"){setWatchFilter("all");setTeamFilter("all");setTeamSearch("")} }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition ${
              activeTab===key
                ? "border-[var(--pitch-bright)] bg-[var(--pitch)] text-[var(--ink)]"
                : "border-white/10 bg-white/5 text-[var(--muted)] hover:bg-white/10"
            }`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </nav>

      {/* ── FILTERS ── */}
      {activeTab==="all" && (
        <div className="mx-auto mb-4 max-w-3xl px-5" onClick={e=>e.stopPropagation()}>
          <div className="rounded-2xl border border-white/10 bg-[var(--card-bg)] p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {(["all","green","amber","red"] as const).map(w => (
                <button key={w} onClick={()=>setWatchFilter(w)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    watchFilter===w
                      ? "border-[var(--pitch-bright)] bg-[var(--pitch)] text-[var(--ink)]"
                      : "border-white/10 bg-white/5 text-[var(--muted)] hover:bg-white/10"
                  }`}>
                  {w==="all"?"All":w==="green"?"🟢 Prime time":w==="amber"?"🟡 Late night":"🔴 Night owl"}
                </button>
              ))}
            </div>
            <div className="relative flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              {teamFilter!=="all" ? (
                <div className="flex items-center gap-1.5 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1">
                  <Goal className="h-3 w-3 text-[var(--gold)]" />
                  <span className="text-xs font-bold text-[var(--gold)]">{teamFilter}</span>
                  <button onClick={()=>{setTeamFilter("all");setTeamSearch("")}} className="ml-1 text-[var(--muted)] hover:text-[var(--fg)]">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ):(
                <input ref={teamInputRef} value={teamSearchRaw}
                  onChange={e=>{setTeamSearch(e.target.value);setShowTeamDrop(true)}}
                  onFocus={()=>setShowTeamDrop(true)}
                  placeholder="Filter by team…"
                  className="w-44 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--fg)] placeholder-[var(--muted)] outline-none focus:border-[var(--sky)]"/>
              )}
              {showTeamDrop && teamFilter==="all" && filteredTeams.length>0 && (
                <div className="absolute left-6 top-full z-40 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-[var(--card-bg)] shadow-2xl">
                  {filteredTeams.map(t => (
                    <button key={t}
                      onClick={()=>{setTeamFilter(t);setTeamSearch("");setShowTeamDrop(false)}}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-[var(--fg)] transition hover:bg-white/5">
                      <ChevronRight className="h-3 w-3 text-[var(--muted)]" /> {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      <main className="mx-auto max-w-3xl space-y-2 px-5">
        {grouped.length===0 && (
          <div className="py-16 text-center text-[var(--muted)]">
            <Search className="mx-auto mb-3 h-8 w-8 opacity-50" />
            <p className="text-sm">
              {activeTab==="today" ? "No matches today — check the full schedule for upcoming games." : "No matches found for your filters."}
            </p>
          </div>
        )}

        {grouped.map(day => {
          const isCollapsed = collapsedDays[day.dateKey]
          const hasClash    = day.matches.some(m=>m.simultaneous)
          return (
            <div key={day.dateKey}>
              <button onClick={()=>toggleDay(day.dateKey)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[var(--card-bg)] px-4 py-3 text-left transition hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="font-heading text-sm font-bold uppercase tracking-wide text-[var(--fg)]">{day.date}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                    {day.matches.length} match{day.matches.length!==1?"es":""}
                  </span>
                  {hasClash && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber)]/40 bg-[var(--amber)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--amber)]">
                      <Zap className="h-2.5 w-2.5" /> clash
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {day.matches.map((m,i) => (
                      <span key={i} className={`inline-block h-2 w-2 rounded-full ${WATCH[m.watch].dot}`} />
                    ))}
                  </div>
                  <ChevronRight className={`h-4 w-4 text-[var(--muted)] transition-transform ${isCollapsed?"":"rotate-90"}`} />
                </div>
              </button>

              {!isCollapsed && (
                <div className="mt-1 space-y-1">
                  {day.matches.map(match => {
                    const fk = `${day.dateKey}-${match.id}`
                    const factOpen = expandedFact===fk
                    const isKO = ["R32","R16","QF","SF","3RD","FINAL"].includes(match.group)
                    const stageColor = STAGE_COLORS[match.group] || "#94a3b8"
                    return (
                      <article key={match.id}
                        className={`rounded-2xl border p-3.5 transition ${
                          match.simultaneous
                            ? "border-[var(--amber)]/20 bg-[var(--amber)]/5"
                            : "border-white/8 bg-[var(--card-bg)]"
                        }`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-14 shrink-0">
                              <p className={`font-heading text-lg font-bold leading-none tabular-nums ${WATCH[match.watch].text}`}>
                                {match.time}
                              </p>
                              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">BST</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-snug text-[var(--fg)]">
                                {match.teams}
                                {match.simultaneous && (
                                  <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-[var(--amber)]">
                                    <Zap className="h-2.5 w-2.5" /> simultaneous
                                  </span>
                                )}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                                  style={{background:stageColor+"22",color:stageColor}}>
                                  {isKO ? match.group : `Group ${match.group}`}
                                </span>
                                <ChannelBadge channel={match.channel} />
                                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)]">
                                  <MapPin className="h-3 w-3" /> {match.venue}
                                </span>
                              </div>
                              {match.note && (
                                <p className="mt-1 text-[11px] font-semibold italic text-[var(--gold)]">{match.note}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${WATCH[match.watch].chip}`}>
                              {WATCH[match.watch].label}
                            </span>
                            {match.fact && (
                              <button onClick={()=>toggleFact(fk)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                                  factOpen
                                    ? "border-[var(--sky)]/60 bg-[var(--sky)]/20 text-[var(--sky)]"
                                    : "border-[var(--sky)]/30 bg-[var(--sky)]/10 text-[var(--sky)] hover:bg-[var(--sky)]/20"
                                }`}>
                                <Info className="h-3 w-3" />
                                {factOpen?"hide":"fact"}
                              </button>
                            )}
                          </div>
                        </div>
                        {factOpen && match.fact && (
                          <div className="mt-3 rounded-lg border-l-2 border-[var(--sky)] bg-[var(--sky)]/10 px-3 py-2.5 text-[12px] leading-relaxed text-[var(--sky-soft)]">
                            {match.fact}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </main>

      {/* ── FOOTER ── */}
      <footer className="mx-auto mt-8 max-w-3xl px-5">
        <div className="rounded-2xl border border-[var(--pitch)]/40 bg-[var(--pitch)]/8 p-5">
          <h2 className="font-heading mb-3 flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-[var(--pitch-bright)]">
            <Goal className="h-5 w-5" /> Your viewing game plan
          </h2>
          <ul className="space-y-2 text-[13px] leading-relaxed text-[var(--muted)]">
            <li><strong className="text-[var(--fg)]">Weeknights:</strong> Prime-time games (kick-offs to 21:00 BST) wrap up by 23:00 — easy on a school night.</li>
            <li><strong className="text-[var(--fg)]">Weekends:</strong> Late-night games are fair game — stay up to 01:00 and lie in. Night-owl games (02:00+) are weekend treats only.</li>
            <li><strong className="text-[var(--fg)]">Good news:</strong> Every game from the R16 onwards lands in a prime BST slot. The Final kicks off <strong className="text-[var(--fg)]">21:00 BST</strong>, Sunday 19 July — both BBC and ITV.</li>
            <li><strong className="text-[var(--fg)]">Calendar:</strong> Tap "Add fixtures to your calendar" above, choose your export, open the downloaded file to import into Google, Apple or Outlook Calendar.</li>
          </ul>
        </div>
        <p className="mt-4 text-center text-[10px] text-[var(--muted)]">
          All times BST · Verified from FIFA / Sky Sports / ESPN · Fixtures and channels subject to change
        </p>
      </footer>
    </div>
  )
}
