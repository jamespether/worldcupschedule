"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Trophy,
  CalendarDays,
  Search,
  X,
  ChevronRight,
  Zap,
  Tv,
  MapPin,
  Info,
  Moon,
  Sunrise,
  CircleDot,
  Goal,
} from "lucide-react"

// ─── DATA ────────────────────────────────────────────────────────────────────
// watch: green = ends by ~23:00, amber = ends ~01:00 (weekends), red = KO after 01:00 (weekends only)

type Match = {
  id: number
  dateKey: string
  date: string
  time: string
  teams: string
  group: string
  venue: string
  watch: "green" | "amber" | "red"
  channel: string
  fact?: string
  note?: string
  simultaneous?: boolean
}

const ALL_MATCHES: Match[] = [
  // ── GROUP STAGE ──────────────────────────────────────────────────────────
  { id:1,  dateKey:"2026-06-11", date:"Thu 11 Jun", time:"20:00", teams:"Mexico vs South Africa",           group:"A", venue:"Mexico City",   watch:"green", channel:"ITV1",    fact:"Mexico & South Africa opened the 2010 World Cup together — the last time the tournament was on African soil. South Africa drew 1-1 that day." },
  { id:2,  dateKey:"2026-06-12", date:"Fri 12 Jun", time:"20:00", teams:"Canada vs Bosnia & Herz.",         group:"B", venue:"Toronto",        watch:"green", channel:"BBC",     fact:"Canada are hosting on home soil for the first time. BMO Field in Toronto holds 45,000 — it'll be a sold-out home atmosphere for the co-hosts." },
  { id:3,  dateKey:"2026-06-12", date:"Fri 12 Jun", time:"23:00", teams:"Qatar vs Switzerland",             group:"B", venue:"San Jose",       watch:"amber", channel:"ITV",     fact:"Qatar never won a World Cup group stage match in 2022 as hosts. Switzerland have reached the knockouts in 4 of the last 5 tournaments." },
  { id:4,  dateKey:"2026-06-13", date:"Sat 13 Jun", time:"03:00", teams:"South Korea vs Czechia",           group:"A", venue:"Zapopan",        watch:"red",   channel:"ITV",     fact:"Son Heung-min will be 34 during this tournament — almost certainly his final World Cup. He is South Korea's all-time record scorer." },
  { id:5,  dateKey:"2026-06-13", date:"Sat 13 Jun", time:"23:00", teams:"Brazil vs Morocco",                group:"C", venue:"New York/NJ",   watch:"amber", channel:"BBC",     fact:"Brazil have won 5 World Cups but last lifted the trophy in 2002. Morocco became the first African nation to reach a semi-final in 2022." },
  { id:6,  dateKey:"2026-06-14", date:"Sun 14 Jun", time:"02:00", teams:"USA vs Paraguay",                  group:"D", venue:"Los Angeles",    watch:"red",   channel:"BBC",     fact:"The USA play at SoFi Stadium — the most expensive sports stadium ever built at $5.5 billion. As co-hosts they are genuine dark horses." },
  { id:7,  dateKey:"2026-06-14", date:"Sun 14 Jun", time:"00:00", teams:"Haiti vs Scotland",                group:"C", venue:"Miami",          watch:"amber", channel:"BBC",     note:"Scotland opener!", fact:"Scotland's first World Cup since 1998 — a 28-year wait finally ends. Haiti are making only their second ever World Cup appearance." },
  { id:8,  dateKey:"2026-06-14", date:"Sun 14 Jun", time:"05:00", teams:"Australia vs Turkey",              group:"D", venue:"San Jose",       watch:"red",   channel:"ITV",     fact:"Turkey finished 3rd at the 2002 World Cup — their best ever result. Australia's Harry Souttar is one of the most recognisable defenders in world football." },
  { id:9,  dateKey:"2026-06-14", date:"Sun 14 Jun", time:"18:00", teams:"Germany vs Curacao",               group:"E", venue:"New Jersey",     watch:"green", channel:"ITV",     fact:"Germany are the most successful nation by World Cup final appearances. Curacao (pop. 150,000) are making their first ever World Cup — a fairytale debut." },
  { id:10, dateKey:"2026-06-14", date:"Sun 14 Jun", time:"21:00", teams:"Netherlands vs Japan",             group:"F", venue:"Dallas",         watch:"green", channel:"ITV",     fact:"Japan shocked Germany and Spain in 2022. The Netherlands haven't won a World Cup despite three finals (1974, 1978, 2010) — the greatest team never to win it." },
  { id:11, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"00:00", teams:"Ivory Coast vs Ecuador",           group:"E", venue:"Kansas City",    watch:"amber", channel:"BBC",     fact:"Ecuador qualified from South America in style and beat the hosts Qatar in the 2022 opening game. Ivory Coast are Africa's most physically imposing side." },
  { id:12, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"03:00", teams:"Sweden vs Tunisia",                group:"F", venue:"Guadalajara",    watch:"red",   channel:"ITV",     fact:"Sweden qualified without Zlatan Ibrahimović who retired internationally. Alexander Isak (Newcastle) leads a strong Scandinavian side." },
  { id:13, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"17:00", teams:"Spain vs Cape Verde",              group:"H", venue:"Atlanta",        watch:"green", channel:"ITV",     fact:"Spain are the reigning European Champions (Euro 2024). Cape Verde's population of 550,000 makes them one of the smallest nations at a World Cup." },
  { id:14, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"20:00", teams:"Belgium vs Egypt",                 group:"G", venue:"Los Angeles",    watch:"green", channel:"BBC",     fact:"Romelu Lukaku is Belgium's all-time top scorer and desperate for a major trophy. Egypt's Mo Salah at 34 — this is his World Cup moment or never." },
  { id:15, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"20:00", teams:"France vs Senegal",                group:"I", venue:"New York/NJ",   watch:"green", channel:"BBC",     simultaneous:true, fact:"France are the defending champions. Many Senegal players play in Ligue 1 — this is a game full of club teammates facing each other." },
  { id:16, dateKey:"2026-06-15", date:"Mon 15 Jun", time:"23:00", teams:"Saudi Arabia vs Uruguay",          group:"H", venue:"Miami",          watch:"amber", channel:"ITV",     fact:"Saudi Arabia famously beat Argentina 2-1 in 2022 — one of the biggest upsets in World Cup history. Uruguay were winners in 1930 and 1950." },
  { id:17, dateKey:"2026-06-16", date:"Tue 16 Jun", time:"02:00", teams:"Iran vs New Zealand",              group:"G", venue:"Los Angeles",    watch:"red",   channel:"BBC",     fact:"Iran caused a sensation in 2022 by briefly leading the USA before qualifying from a tough group. New Zealand have never won a World Cup match." },
  { id:18, dateKey:"2026-06-16", date:"Tue 16 Jun", time:"20:00", teams:"Switzerland vs Bosnia & Herz.",    group:"B", venue:"Los Angeles",    watch:"green", channel:"ITV",     fact:"Switzerland beat France on penalties in Euro 2020 — one of the great upsets of recent football. Bosnia & Herzegovina have never won a World Cup match." },
  { id:19, dateKey:"2026-06-16", date:"Tue 16 Jun", time:"23:00", teams:"Canada vs Qatar",                  group:"B", venue:"Vancouver",      watch:"amber", channel:"ITV",     fact:"Canada's Alphonso Davies is one of the fastest players on earth. Qatar lost all 3 group games as 2022 hosts — looking to avoid a repeat." },
  { id:20, dateKey:"2026-06-16", date:"Tue 16 Jun", time:"23:00", teams:"Iraq vs Norway",                   group:"I", venue:"Philadelphia",   watch:"amber", channel:"BBC",     simultaneous:true, fact:"Norway's Erling Haaland is arguably the world's best striker. Iraq's qualification ended a 40-year wait since they last appeared at a World Cup in 1986." },
  { id:21, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"02:00", teams:"Argentina vs Algeria",             group:"J", venue:"San Jose",       watch:"red",   channel:"ITV",     fact:"Argentina are the reigning World Champions. Messi will be 39 — this is almost certainly his final World Cup, defending the title he won in Qatar." },
  { id:22, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"05:00", teams:"Austria vs Jordan",                group:"J", venue:"Santa Clara",    watch:"red",   channel:"BBC",     fact:"Jordan are making their second ever World Cup appearance. Austria have a talented new generation led by Marcel Sabitzer and David Alaba." },
  { id:23, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"18:00", teams:"Portugal vs DR Congo",             group:"K", venue:"Boston",         watch:"green", channel:"BBC",     fact:"Cristiano Ronaldo will be 41 years old — almost certainly his farewell World Cup. DR Congo are the most decorated African nation by AFCON wins." },
  { id:24, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"21:00", teams:"England vs Croatia",               group:"L", venue:"Dallas",         watch:"green", channel:"ITV1",    note:"England opener!", fact:"Croatia knocked England out in the 2018 semi-final. England got revenge in Euro 2020 group stage. Under Tuchel, this is a new era — but the rivalry is real." },
  { id:25, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"00:00", teams:"Ghana vs Panama",                  group:"L", venue:"San Jose",       watch:"amber", channel:"ITV",     fact:"Panama's first appearance since their debut at Russia 2018. Ghana have Premier League quality throughout — Partey (Arsenal) and Kudus (West Ham) lead the way." },
  { id:26, dateKey:"2026-06-17", date:"Wed 17 Jun", time:"03:00", teams:"Uzbekistan vs Colombia",           group:"K", venue:"Dallas",         watch:"red",   channel:"BBC",     fact:"Uzbekistan are making their World Cup debut. Colombia have James Rodríguez — Golden Boot winner at the 2014 World Cup — pulling the strings." },
  { id:27, dateKey:"2026-06-18", date:"Thu 18 Jun", time:"17:00", teams:"Czechia vs South Africa",          group:"A", venue:"Atlanta",        watch:"green", channel:"BBC",     fact:"South Africa are the only African nation to host a World Cup (2010). They were the first hosts ever eliminated in the group stage — desperate to improve that legacy." },
  { id:28, dateKey:"2026-06-18", date:"Thu 18 Jun", time:"20:00", teams:"Switzerland vs Bosnia & Herz.",    group:"B", venue:"Los Angeles",    watch:"green", channel:"ITV",     fact:"Group B's second round. Switzerland are meticulous in tournament football — they have never lost a World Cup group game against a European opponent." },
  { id:29, dateKey:"2026-06-18", date:"Thu 18 Jun", time:"23:00", teams:"Canada vs Qatar",                  group:"B", venue:"Vancouver",      watch:"amber", channel:"ITV",     fact:"Canada need a strong home showing. Alphonso Davies at left-back is one of the most exciting players in world football — a Bayern Munich starter at just 25." },
  { id:30, dateKey:"2026-06-19", date:"Fri 19 Jun", time:"02:00", teams:"Mexico vs South Korea",            group:"A", venue:"Zapopan",        watch:"red",   channel:"BBC",     fact:"Mexico's 'El Quinto Partido' curse — knocked out in the Round of 16 at 7 consecutive World Cups. Son Heung-min will not make it easy for them." },
  { id:31, dateKey:"2026-06-19", date:"Fri 19 Jun", time:"20:00", teams:"USA vs Australia",                 group:"D", venue:"Seattle",        watch:"green", channel:"BBC",     fact:"USA play at Lumen Field, home of the Seattle Seahawks. A packed partisan crowd. Christian Pulisic — the first American to win the Champions League — leads the line." },
  { id:32, dateKey:"2026-06-19", date:"Fri 19 Jun", time:"23:00", teams:"Scotland vs Morocco",              group:"C", venue:"Miami",          watch:"amber", channel:"ITV1",    note:"Scotland must win!", fact:"Morocco are ranked top 15 globally after their historic 2022 run to the semi-finals. Scotland need something here to have a shot at the knockouts." },
  { id:33, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"02:00", teams:"Brazil vs Haiti",                  group:"C", venue:"Miami",          watch:"red",   channel:"ITV",     fact:"Brazil have never been knocked out before the quarter-finals. Haiti's qualification amid their country's ongoing political instability is one of sport's great stories." },
  { id:34, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"05:00", teams:"Turkey vs Paraguay",               group:"D", venue:"San Jose",       watch:"red",   channel:"ITV",     fact:"Turkey's 3rd-place finish in 2002 was the high point of their history. Paraguay have never progressed beyond the quarter-finals." },
  { id:35, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"18:00", teams:"Netherlands vs Sweden",            group:"F", venue:"Dallas",         watch:"green", channel:"BBC",     fact:"A Scandinavian derby of sorts. Netherlands' Tijjani Reijnders and Xavi Simons have been electrifying in 2025-26. Sweden's Isak is one of Europe's deadliest finishers." },
  { id:36, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"21:00", teams:"Germany vs Ivory Coast",           group:"E", venue:"Toronto",        watch:"green", channel:"ITV",     fact:"Germany and Ivory Coast have history — Didier Drogba once scored in a 5-2 friendly defeat to Germany. The Elephants are one of Africa's strongest nations." },
  { id:37, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"01:00", teams:"Ecuador vs Curacao",               group:"E", venue:"Kansas City",    watch:"red",   channel:"BBC",     fact:"Curacao's debut World Cup continues. Ecuador will be confident after beating Uruguay in qualifying. A shootout for Group E's second qualifying spot." },
  { id:38, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"05:00", teams:"Tunisia vs Japan",                 group:"F", venue:"Guadalajara",    watch:"red",   channel:"BBC",     fact:"Japan have now reached the knockouts at 4 consecutive World Cups. Tunisia have appeared 6 times and never survived the group stage." },
  { id:39, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"17:00", teams:"Spain vs Saudi Arabia",            group:"H", venue:"Atlanta",        watch:"green", channel:"BBC",     fact:"Spain aim to become the first nation to win back-to-back Euros and then a World Cup. Saudi Arabia's league now features ex-Premier League stars including Benzema." },
  { id:40, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"20:00", teams:"Belgium vs Iran",                  group:"G", venue:"Los Angeles",    watch:"green", channel:"ITV",     fact:"Kevin De Bruyne may be playing his final World Cup. Iran caused a sensation in 2022 — their first World Cup win over Wales had their nation celebrating worldwide." },
  { id:41, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"23:00", teams:"Uruguay vs Cape Verde",            group:"H", venue:"Miami",          watch:"amber", channel:"BBC",     note:"Weekend!", fact:"Uruguay have 2 World Cup wins (1930, 1950) but haven't triumphed since. Cape Verde — a group of Atlantic islands — are one of football's most surprising success stories." },
  { id:42, dateKey:"2026-06-22", date:"Mon 22 Jun", time:"02:00", teams:"New Zealand vs Egypt",             group:"G", venue:"Vancouver",      watch:"red",   channel:"ITV",     fact:"New Zealand have never won a World Cup match. Egypt's Mo Salah at 34 — this tournament could be the defining chapter of his legacy." },
  { id:43, dateKey:"2026-06-22", date:"Mon 22 Jun", time:"18:00", teams:"Argentina vs Austria",             group:"J", venue:"Dallas",         watch:"green", channel:"BBC",     fact:"Austria once beat Argentina 6-1 at the 1958 World Cup. Messi will want to win this group convincingly and set up the most favourable knockout path." },
  { id:44, dateKey:"2026-06-22", date:"Mon 22 Jun", time:"22:00", teams:"France vs Iraq",                   group:"I", venue:"Philadelphia",   watch:"green", channel:"BBC",     fact:"Kylian Mbappé is favourite to win the Golden Boot. France vs Iraq is a mismatch on paper — but at expanded World Cups, every game carries upset potential." },
  { id:45, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"01:00", teams:"Norway vs Senegal",                group:"I", venue:"Toronto",        watch:"red",   channel:"ITV",     fact:"Erling Haaland vs Sadio Mané — two of the world's most lethal forwards. Norway haven't been at a World Cup since 1998. Senegal won two AFCON titles in the 2020s." },
  { id:46, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"04:00", teams:"Jordan vs Algeria",                group:"J", venue:"Santa Clara",    watch:"red",   channel:"ITV",     fact:"Algeria have the most World Cup appearances of any Arab nation. Jordan's qualification was historic — they have one of the smallest football budgets in the tournament." },
  { id:47, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"18:00", teams:"Portugal vs Uzbekistan",           group:"K", venue:"San Jose",       watch:"green", channel:"ITV",     fact:"Ronaldo vs a debutant nation at potentially his last World Cup. Portugal have Bruno Fernandes, Bernardo Silva and Vitinha — a midfield that rivals any in the world." },
  { id:48, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"21:00", teams:"England vs Ghana",                 group:"L", venue:"Boston",         watch:"green", channel:"BBC One",  note:"England must win!", fact:"Ghana have Premier League quality: Partey (Arsenal) and Kudus (West Ham). England need a win here to be confident of topping Group L." },
  { id:49, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"00:00", teams:"Panama vs Croatia",                group:"L", venue:"San Jose",       watch:"amber", channel:"BBC",     fact:"Croatia — runners-up in 2018 — need a result to stay alive. Luka Modrić at 41 is one of the tournament's great story lines: still playing at the highest level." },
  { id:50, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"03:00", teams:"Colombia vs DR Congo",             group:"K", venue:"Dallas",         watch:"red",   channel:"ITV",     fact:"Colombia's James Rodríguez won the Golden Boot at 2014 World Cup. DR Congo are making their first World Cup since 1974 under their previous name Zaire." },
  { id:51, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"20:00", teams:"Bosnia & Herz. vs Qatar",          group:"B", venue:"Seattle",        watch:"green", channel:"ITV",     simultaneous:true, fact:"Group B's final round — both teams played out their campaign. Qatar may already be eliminated but national pride is on the line at this expanded tournament." },
  { id:52, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"20:00", teams:"Switzerland vs Canada",            group:"B", venue:"Vancouver",      watch:"green", channel:"ITV",     simultaneous:true, note:"Simultaneous final group game — clash!", fact:"Both teams could qualify from this one. Switzerland vs Canada could be the game that decides Group B's fate — classic World Cup group-day drama." },
  { id:53, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"23:00", teams:"Morocco vs Haiti",                 group:"C", venue:"Atlanta",        watch:"amber", channel:"BBC",     simultaneous:true, fact:"Morocco will likely already be through. Haiti need a win to have any hope of the third-place wildcard spots." },
  { id:54, dateKey:"2026-06-24", date:"Wed 24 Jun", time:"23:00", teams:"Scotland vs Brazil",               group:"C", venue:"Miami",          watch:"amber", channel:"BBC",     simultaneous:true, note:"Scotland vs Brazil!", fact:"Scotland opened the 1998 World Cup against Brazil — losing 2-1. A rematch 28 years later is one of the tournament's most anticipated fixtures." },
  { id:55, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"02:00", teams:"Czechia vs Mexico",                group:"A", venue:"Mexico City",    watch:"red",   channel:"BBC",     simultaneous:true, fact:"Group A's final round — both games simultaneous to prevent collusion, a rule introduced after the 1982 'Disgrace of Gijón' where Germany and Austria played out an agreed result." },
  { id:56, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"02:00", teams:"South Africa vs South Korea",      group:"A", venue:"Guadalajara",    watch:"red",   channel:"BBC",     simultaneous:true, fact:"South Africa have not won a World Cup match since hosting in 2010. Son Heung-min needs goals to prove South Korea's worth." },
  { id:57, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"21:00", teams:"Ecuador vs Germany",               group:"E", venue:"New Jersey",     watch:"green", channel:"ITV",     fact:"Germany rebuilt after a poor 2022. Ecuador have one of the youngest squads in the tournament — fearless and full of running." },
  { id:58, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"20:00", teams:"Croatia vs England",               group:"L", venue:"Dallas",         watch:"green", channel:"ITV1",    note:"England decider!", fact:"The Group L finale could decide who tops the group. England will want to avoid a tricky runner-up route through the knockouts." },
  { id:59, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"23:00", teams:"Portugal vs Colombia",             group:"K", venue:"Boston",         watch:"amber", channel:"BBC",     fact:"Two attacking sides. Ronaldo vs James Rodríguez — a battle of two players defining the twilight of their international careers." },

  // ── MISSING GROUP-STAGE GAMES ─────────────────────────────────────────────
  // Group D round 2 & 3
  { id:60, dateKey:"2026-06-19", date:"Fri 19 Jun", time:"23:00", teams:"Turkey vs USA",                   group:"D", venue:"Seattle",        watch:"amber", channel:"ITV",     fact:"Turkey's Hakan Çalhanoğlu (Inter) is one of Europe's best midfielders. The USA on home turf at Lumen Field makes this Group D tie explosive." },
  { id:61, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"02:00", teams:"Paraguay vs Australia",           group:"D", venue:"San Jose",       watch:"red",   channel:"BBC",     fact:"Paraguay have never reached a semi-final — their best World Cup showings came in 2010 quarter-finals. Australia's Sam Kerr era ended; the men aim to carry momentum." },
  { id:62, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"23:00", teams:"USA vs Turkey",                   group:"D", venue:"Los Angeles",    watch:"amber", channel:"BBC",     simultaneous:true, fact:"Group D's final round. The USA at home need a win or draw. Turkey's Güler and Çalhanoğlu will test any backline in the world." },
  { id:63, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"23:00", teams:"Australia vs Paraguay",           group:"D", venue:"Seattle",        watch:"amber", channel:"ITV",     simultaneous:true, fact:"Australia need a result to have any chance of advancing. Paraguay haven't been past the last 16 since 2010." },
  // Group E round 3
  { id:64, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"21:00", teams:"Ivory Coast vs Germany",          group:"E", venue:"Toronto",        watch:"green", channel:"BBC",     simultaneous:true, fact:"Group E's final round — Germany top if they avoid defeat, but Ivory Coast are dangerous. Zaha's international legacy vs German efficiency." },
  { id:65, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"21:00", teams:"Curacao vs Ecuador",              group:"E", venue:"Kansas City",    watch:"green", channel:"ITV",     simultaneous:true, fact:"Curacao's debut World Cup wraps up in Group E. Ecuador will go through if they match Germany's result — a classic final-day scenario." },
  // Group F round 3
  { id:66, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"23:00", teams:"Japan vs Netherlands",            group:"F", venue:"Dallas",         watch:"amber", channel:"BBC",     simultaneous:true, fact:"Japan shocked the Netherlands' predecessor 'Clockwork Orange' era at youth level. This is the kind of final-day clash that defines World Cups." },
  { id:67, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"02:00", teams:"Sweden vs Tunisia",               group:"F", venue:"Guadalajara",    watch:"red",   channel:"ITV",     simultaneous:true, fact:"Sweden need a win to advance. Tunisia have never survived the group stage — four appearances, zero progression. This is a must-win for both." },
  // Group G round 2 & 3
  { id:68, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"02:00", teams:"Belgium vs New Zealand",          group:"G", venue:"Vancouver",      watch:"red",   channel:"ITV",     fact:"Belgium's golden generation — De Bruyne, Lukaku, Courtois — get one last shot at glory. New Zealand haven't won a World Cup match since 2010." },
  { id:69, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"05:00", teams:"Egypt vs Iran",                   group:"G", venue:"Los Angeles",    watch:"red",   channel:"BBC",     fact:"Mo Salah vs Iran's organised defence. Egypt's squad is built around Liverpool's captain — their chances hinge almost entirely on his brilliance." },
  { id:70, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"20:00", teams:"Iran vs Belgium",                 group:"G", venue:"Los Angeles",    watch:"green", channel:"BBC",     simultaneous:true, fact:"Belgium need a win to advance — anything less risks a shock exit. Iran beat Wales in 2022; they are nobody's pushover." },
  { id:71, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"20:00", teams:"New Zealand vs Egypt",            group:"G", venue:"Vancouver",      watch:"green", channel:"ITV",     simultaneous:true, fact:"New Zealand vs Egypt — whoever wins stays alive. Salah knows this is likely his last chance to make a World Cup knockout impact." },
  // Group H round 2 & 3
  { id:72, dateKey:"2026-06-21", date:"Sun 21 Jun", time:"17:00", teams:"Cape Verde vs Saudi Arabia",      group:"H", venue:"Atlanta",        watch:"green", channel:"BBC",     fact:"Cape Verde's island nation of 550,000 against the Saudi petro-funded project. David vs Goliath vibes in Atlanta." },
  { id:73, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"17:00", teams:"Spain vs Uruguay",                group:"H", venue:"Miami",          watch:"green", channel:"ITV1",    simultaneous:true, note:"Spain finale!", fact:"Spain have beaten Uruguay before — but not at a World Cup. Group H's finale could see the defending Euro champions face elimination if they've been complacent." },
  { id:74, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"17:00", teams:"Saudi Arabia vs Cape Verde",      group:"H", venue:"Atlanta",        watch:"green", channel:"BBC",     simultaneous:true, fact:"Saudi Arabia need a result to advance. Cape Verde, having stunned the group, will be playing for history — a World Cup knockout berth for the islands." },
  // Group I round 2 & 3
  { id:75, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"21:00", teams:"France vs Norway",                group:"I", venue:"Toronto",        watch:"green", channel:"ITV1",    fact:"Mbappé vs Haaland — possibly the two best players on the planet, both under 26. This is the match of the group stage." },
  { id:76, dateKey:"2026-06-20", date:"Sat 20 Jun", time:"23:00", teams:"Senegal vs Iraq",                 group:"I", venue:"Philadelphia",   watch:"amber", channel:"BBC",     fact:"Senegal are strong enough to top this group. Iraq, qualification heroes, face their toughest test yet against African Champions." },
  { id:77, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"02:00", teams:"Norway vs France",                group:"I", venue:"New York/NJ",   watch:"red",   channel:"ITV",     simultaneous:true, fact:"Group I's final round. If France have already qualified, Mbappé may rest — giving Norway a real chance. Haaland in full flight is unstoppable." },
  { id:78, dateKey:"2026-06-25", date:"Thu 25 Jun", time:"02:00", teams:"Iraq vs Senegal",                 group:"I", venue:"Philadelphia",   watch:"red",   channel:"BBC",     simultaneous:true, fact:"Iraq's World Cup adventure concludes. Senegal are likely already through — but nothing is guaranteed at a World Cup final group day." },
  // Group J round 2 & 3
  { id:79, dateKey:"2026-06-22", date:"Mon 22 Jun", time:"21:00", teams:"Algeria vs Austria",              group:"J", venue:"Santa Clara",    watch:"green", channel:"ITV",     fact:"Algeria's Riyad Mahrez was one of the Premier League's most gifted players. Austria have David Alaba — one of the classiest defenders of his generation." },
  { id:80, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"02:00", teams:"Argentina vs Jordan",             group:"J", venue:"San Jose",       watch:"red",   channel:"BBC",     simultaneous:true, note:"Weekend late — Messi!", fact:"Argentina's last group game — almost certainly Messi's final World Cup group stage fixture. A night-owl slot but a once-in-a-lifetime watch." },
  { id:81, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"02:00", teams:"Algeria vs Austria",              group:"J", venue:"Dallas",         watch:"red",   channel:"ITV",     simultaneous:true, fact:"Group J's final round. Algeria have pace and power — but Austria's organisation makes them tricky. The third spot could go to either." },
  // Group K round 2 & 3
  { id:82, dateKey:"2026-06-23", date:"Tue 23 Jun", time:"00:00", teams:"DR Congo vs Uzbekistan",          group:"K", venue:"Boston",         watch:"amber", channel:"ITV",     fact:"DR Congo's first World Cup since 1974. Uzbekistan's debut continues — the Central Asian nation with one of the fastest-growing youth football programmes." },
  { id:83, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"20:00", teams:"Portugal vs DR Congo",            group:"K", venue:"Boston",         watch:"green", channel:"ITV",     simultaneous:true, note:"Portugal finale!", fact:"Ronaldo's farewell tour continues — Portugal need a result to confirm top spot. DR Congo will go down fighting for what could be a historic upset." },
  { id:84, dateKey:"2026-06-27", date:"Sat 27 Jun", time:"20:00", teams:"Colombia vs Uzbekistan",          group:"K", venue:"Dallas",         watch:"green", channel:"BBC",     simultaneous:true, fact:"Colombia need a win here to advance. James Rodríguez in his element — a World Cup group-stage finale is exactly the stage he thrives on." },
  // Group L round 3 (both games simultaneous)
  { id:85, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"20:00", teams:"England vs Panama",               group:"L", venue:"Boston",         watch:"green", channel:"BBC One",  note:"England finale!", simultaneous:true, fact:"England vs Panama with qualification on the line. Three points puts England through — Gareth Southgate's successor will want to top the group." },
  { id:86, dateKey:"2026-06-26", date:"Fri 26 Jun", time:"20:00", teams:"Croatia vs Ghana",                group:"L", venue:"Dallas",         watch:"green", channel:"ITV",     simultaneous:true, fact:"Croatia or Ghana — one goes through. Modrić's Croatia will back themselves; Ghana have the quality to cause an upset on the night." },

  // ── ROUND OF 32 — full 16 games ───────────────────────────────────────────
  { id:87, dateKey:"2026-06-28", date:"Sun 28 Jun", time:"17:00", teams:"Round of 32 — Match 2",   group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"Sunday afternoon knockout football — the new Round of 32 format brings 16 extra do-or-die games, more than doubling the early knockout drama." },
  { id:88, dateKey:"2026-06-29", date:"Mon 29 Jun", time:"21:00", teams:"Round of 32 — Match 4",   group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"Monday night knockout — ideal viewing. Four R32 games on Monday means a full evening of World Cup football to kick-start the week." },
  { id:89, dateKey:"2026-06-30", date:"Tue 30 Jun", time:"17:00", teams:"Round of 32 — Match 5",   group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"The R32 rolls on — five games in three days. Every result eliminates a nation. The 17:00 BST slot is perfect for the school run then sofa." },
  { id:90, dateKey:"2026-06-30", date:"Tue 30 Jun", time:"21:00", teams:"Round of 32 — Match 6",   group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"Tuesday night knockout. With 48 teams the R32 is where the big upsets happen — expect at least one massive shock this week." },
  { id:91, dateKey:"2026-07-01", date:"Wed 1 Jul",  time:"17:00", teams:"Round of 32 — Match 7",   group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"Midweek knockout football — the World Cup is now in full swing. This is the gateway to the last 16." },
  { id:92, dateKey:"2026-07-01", date:"Wed 1 Jul",  time:"21:00", teams:"Round of 32 — Match 8",   group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"Another evening R32 clash — Wednesday prime-time knockout. The favourites will be expecting to cruise through; the underdogs have other ideas." },
  { id:93, dateKey:"2026-07-02", date:"Thu 2 Jul",  time:"17:00", teams:"Round of 32 — Match 9",   group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"The R32 second wave begins. Teams are fresher here than in later rounds — expect attack-minded, high-tempo football." },
  { id:94, dateKey:"2026-07-02", date:"Thu 2 Jul",  time:"21:00", teams:"Round of 32 — Match 10",  group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"Thursday night knockout — by now group-stage drama has faded and pure knockout nerves take over." },
  { id:95, dateKey:"2026-07-03", date:"Fri 3 Jul",  time:"17:00", teams:"Round of 32 — Match 11",  group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"Friday afternoon knockout — the perfect warm-up to a World Cup weekend. By now we know the big sides' likely paths to the final." },
  { id:96, dateKey:"2026-07-03", date:"Fri 3 Jul",  time:"21:00", teams:"Round of 32 — Match 12",  group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"Friday night R32 — arguably the best slot. Prime-time, end of the working week, World Cup knockout football." },
  { id:97, dateKey:"2026-07-04", date:"Sat 4 Jul",  time:"17:00", teams:"Round of 32 — Match 13",  group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"USA Independence Day and a Round of 32 game — expect enormous American atmosphere at whichever stadium hosts this one." },
  { id:98, dateKey:"2026-07-04", date:"Sat 4 Jul",  time:"19:00", teams:"Round of 32 — Match 14",  group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"The penultimate R32 fixture — only one more to go before the last 16. Knockout football at its most concentrated." },
  { id:99, dateKey:"2026-07-05", date:"Sun 5 Jul",  time:"20:00", teams:"Round of 32 — Match 16",  group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"The last of the 16 Round of 32 games — and the gateway into the last 16. By now, only 16 nations remain to battle for the World Cup." },
  // ── ROUND OF 16 — full 8 games ────────────────────────────────────────────
  { id:112, dateKey:"2026-07-06", date:"Mon 6 Jul",  time:"17:00", teams:"Round of 16 — Match 1",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"The last 16 begins. From here every game is straight elimination — lose and your World Cup is over. The stakes couldn't be higher." },
  { id:113, dateKey:"2026-07-06", date:"Mon 6 Jul",  time:"21:00", teams:"Round of 16 — Match 2",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"Monday night last-16 football — the pressure on every player is immense. One bad performance ends your tournament." },
  { id:114, dateKey:"2026-07-07", date:"Tue 7 Jul",  time:"21:00", teams:"Round of 16 — Match 3",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"By the Round of 16 the smaller nations that snuck through are tested by powerhouses. Expect tactical battles and late drama." },
  { id:115, dateKey:"2026-07-08", date:"Wed 8 Jul",  time:"17:00", teams:"Round of 16 — Match 5",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"Midweek Round of 16 — the World Cup is now in its most intense phase. Every game could include penalties, extra time and heartbreak." },
  { id:116, dateKey:"2026-07-08", date:"Wed 8 Jul",  time:"21:00", teams:"Round of 16 — Match 6",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"Wednesday night R16. All 8 last-16 games spread across four days — perfect for UK viewers. No fixture lands after midnight." },
  { id:117, dateKey:"2026-07-09", date:"Thu 9 Jul",  time:"17:00", teams:"Round of 16 — Match 7",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"One of the most watchable R16 slots — 17:00 BST means you can watch on your phone commuting home and settle in for extra time if needed." },
  { id:118, dateKey:"2026-07-09", date:"Thu 9 Jul",  time:"21:00", teams:"Round of 16 — Match 8",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"The final Round of 16 fixture — after this only 8 nations remain. The road to MetLife Stadium is getting narrower by the day." },
  // ── QUARTER-FINALS — full 4 games ─────────────────────────────────────────
  { id:119, dateKey:"2026-07-10", date:"Fri 10 Jul", time:"17:00", teams:"Quarter-final 1",          group:"QF",  venue:"TBC", watch:"green", channel:"TBC", fact:"Quarter-final day one — the best 8 nations left. At this stage every team is capable of winning the World Cup. Pure knockout drama." },
  { id:120, dateKey:"2026-07-11", date:"Sat 11 Jul", time:"17:00", teams:"Quarter-final 3",          group:"QF",  venue:"TBC", watch:"green", channel:"TBC", fact:"Saturday afternoon World Cup quarter-final — get the barbecue on and settle in. Perfect weekend football." },
  { id:121, dateKey:"2026-07-11", date:"Sat 11 Jul", time:"21:00", teams:"Quarter-final 4",          group:"QF",  venue:"TBC", watch:"green", channel:"TBC", note:"Weekend!", fact:"Saturday night quarter-final — arguably the best slot of the entire tournament. No work tomorrow. No reason to go to bed early. This is it." },
  // ── KNOCKOUTS ────────────────────────────────────────────────────────────
  { id:101,dateKey:"2026-06-28", date:"Sun 28 Jun", time:"21:00", teams:"Round of 32 — Match 1",  group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"The expanded 48-team format means a brand new Round of 32 — 16 extra knockout games before the last 16. More do-or-die drama than ever before." },
  { id:102,dateKey:"2026-06-29", date:"Mon 29 Jun", time:"17:00", teams:"Round of 32 — Match 3",  group:"R32", venue:"TBC", watch:"green", channel:"TBC", fact:"An afternoon kick-off — the 17:00 BST slot is one of the most watchable for UK fans. Straight off the sofa and into the knockouts." },
  { id:103,dateKey:"2026-07-03", date:"Fri 3 Jul",  time:"23:00", teams:"Round of 32 — Match 15", group:"R32", venue:"TBC", watch:"amber", channel:"TBC", fact:"The penultimate R32 game — late but on a Friday. A 23:00 BST kick-off finishes just after 1am. The weekend lie-in covers it." },
  { id:104,dateKey:"2026-07-04", date:"Sat 4 Jul",  time:"22:00", teams:"Round of 16 — Match 2",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"The 22:00 BST slot is ideal — kick-off after dinner, final whistle before midnight. Perfect World Cup viewing." },
  { id:105,dateKey:"2026-07-07", date:"Tue 7 Jul",  time:"17:00", teams:"Round of 16 — Match 7",  group:"R16", venue:"TBC", watch:"green", channel:"TBC", fact:"The 17:00 BST R16 slot — absolutely perfect. Catch it on your phone on the commute home, or settle in for the evening. This is the dream slot." },
  { id:106,dateKey:"2026-07-10", date:"Fri 10 Jul", time:"20:00", teams:"Quarter-final 2",          group:"QF",  venue:"TBC", watch:"green", channel:"TBC", fact:"Friday night World Cup quarter-final — arguably the best possible way to end the week. Book the evening and make no other plans." },
  { id:107,dateKey:"2026-07-12", date:"Sun 12 Jul", time:"02:00", teams:"Quarter-final 4",          group:"QF",  venue:"TBC", watch:"red",   channel:"TBC", note:"Weekend late", fact:"The only QF in the night-owl zone — a very late Sunday night. Worth it for a quarter-final. Lie in on Monday if you can. This is the World Cup." },
  { id:108,dateKey:"2026-07-14", date:"Tue 14 Jul", time:"20:00", teams:"Semi-final 1",             group:"SF",  venue:"TBC", watch:"green", channel:"TBC", note:"Dream slot!", fact:"World Cup semi-final at 8pm BST — it doesn't get better than this for UK viewers. Build-up from 7pm, kick-off at 8, done by midnight. Set a reminder now." },
  { id:109,dateKey:"2026-07-15", date:"Wed 15 Jul", time:"20:00", teams:"Semi-final 2",             group:"SF",  venue:"TBC", watch:"green", channel:"TBC", note:"Dream slot!", fact:"The second semi-final — and if England are involved, this is the biggest night since 2018. 8pm BST on a Wednesday is perfect. The nation will watch together." },
  { id:110,dateKey:"2026-07-18", date:"Sat 18 Jul", time:"22:00", teams:"Third-place play-off",     group:"3RD", venue:"Miami",          watch:"green", channel:"BBC / ITV",  fact:"Often dismissed but regularly produces classics — Germany vs Uruguay in 2010 was a 7-goal thriller. The 10pm BST kick-off is very civilised." },
  { id:111,dateKey:"2026-07-19", date:"Sun 19 Jul", time:"20:00", teams:"WORLD CUP FINAL",      group:"FINAL",venue:"MetLife Stadium, NJ", watch:"green", channel:"BBC One + ITV1", note:"8pm BST — both channels! Perfect!", fact:"The final is at MetLife Stadium — home of the New York Giants, capacity 82,500. Both BBC and ITV broadcast simultaneously. The last time the final was this viewer-friendly for the UK was 1994 — also in North America." },
]

// ─── TEAMS (for filter) ──────────────────────────────────────────────────────
const TEAM_LIST = [
  "England","Scotland","France","Germany","Spain","Portugal","Netherlands","Belgium",
  "Brazil","Argentina","USA","Mexico","Canada","Japan","South Korea","Morocco",
  "Uruguay","Colombia","Ecuador","Norway","Sweden","Croatia","Switzerland",
  "Senegal","Ivory Coast","Egypt","South Africa","Australia","Turkey","Iran",
  "Saudi Arabia","Qatar","Ghana","Tunisia","New Zealand","Curacao",
  "Cape Verde","Haiti","Paraguay","Czechia","Austria","Jordan","Algeria",
  "Bosnia & Herz.","Iraq","Uzbekistan","DR Congo","Panama",
]

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const WATCH = {
  green: { label: "Prime time", chip: "bg-[var(--pitch)] text-[var(--ink)]", text: "text-[var(--pitch-bright)]", dot: "bg-[var(--pitch-bright)]", soft: "bg-[var(--pitch)]/12 border-[var(--pitch)]/40" },
  amber: { label: "Late night", chip: "bg-[var(--amber)] text-[var(--ink)]", text: "text-[var(--amber)]", dot: "bg-[var(--amber)]", soft: "bg-[var(--amber)]/10 border-[var(--amber)]/40" },
  red:   { label: "Night owl",  chip: "bg-[var(--red)] text-white",          text: "text-[var(--red)]",   dot: "bg-[var(--red)]",   soft: "bg-[var(--red)]/10 border-[var(--red)]/40" },
} as const

const CHANNEL_STYLE: Record<string, string> = {
  "ITV1": "bg-[#FFD400] text-black",
  "ITV": "bg-[#FFD400] text-black",
  "BBC": "bg-[#d4145a] text-white",
  "BBC One": "bg-[#d4145a] text-white",
  "BBC One + ITV1": "bg-[var(--gold)] text-black",
  "BBC / ITV": "bg-[var(--gold)] text-black",
  "TBC": "bg-white/10 text-[var(--muted)]",
}

const STAGE_COLORS: Record<string, string> = {
  A:"#3b82f6",B:"#06b6d4",C:"#22d3ee",D:"#f59e0b",E:"#10b981",F:"#f43f5e",
  G:"#6366f1",H:"#ec4899",I:"#14b8a6",J:"#fb923c",K:"#38bdf8",L:"#facc15",
  R32:"#94a3b8",R16:"#38bdf8",QF:"#a855f7",SF:"#ec4899","3RD":"#a8a29e",FINAL:"#FFD400",
}

// ─── ICS EXPORT ──────────────────────────────────────────────────────────────
function toICSDate(dateKey: string, time: string) {
  const [y, m, d] = dateKey.split("-")
  const [h, min] = time.split(":")
  return `${y}${m}${d}T${h}${min}00`
}

function generateICS(matches: Match[]) {
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//WC2026 UK Guide//EN","CALSCALE:GREGORIAN","X-WR-TIMEZONE:Europe/London"]
  matches.forEach((m) => {
    if (m.time === "Various") return
    const start = toICSDate(m.dateKey, m.time)
    const [sh, sm] = m.time.split(":").map(Number)
    const eh = (sh + 2) % 24
    const endTime = `${String(eh).padStart(2,"0")}:${String(sm).padStart(2,"0")}`
    const end = toICSDate(m.dateKey, endTime)
    const channel = m.channel !== "TBC" ? ` | ${m.channel}` : ""
    lines.push("BEGIN:VEVENT")
    lines.push(`DTSTART;TZID=Europe/London:${start}`)
    lines.push(`DTEND;TZID=Europe/London:${end}`)
    lines.push(`SUMMARY:${m.teams}${channel}`)
    lines.push(`DESCRIPTION:Group ${m.group} | ${m.venue}${channel}\\n${m.fact || ""}`)
    lines.push(`LOCATION:${m.venue}`)
    lines.push(`UID:wc2026-match-${m.id}@worldcup2026ukguide`)
    lines.push("END:VEVENT")
  })
  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

function downloadICS(matches: Match[], filename: string) {
  const content = generateICS(matches)
  const b64 = btoa(unescape(encodeURIComponent(content)))
  const a = document.createElement("a")
  a.href = `data:text/calendar;charset=utf-8;base64,${b64}`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────────
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

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function WorldCupSchedule() {
  const today = new Date().toISOString().split("T")[0]
  const [activeTab, setActiveTab]       = useState("watchable")
  const [watchFilter, setWatchFilter]   = useState("all")
  const [teamFilter, setTeamFilter]     = useState("all")
  const [teamSearchRaw, setTeamSearch]  = useState("")
  const [showTeamDrop, setShowTeamDrop] = useState(false)
  const [expandedFact, setExpandedFact] = useState<string | null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})
  const [showICSMenu, setShowICSMenu]   = useState(false)
  const [countdown, setCountdown]       = useState("")

  const teamSearch = teamSearchRaw.toLowerCase()

  const toggleFact = (k: string) => setExpandedFact((p) => (p === k ? null : k))
  const toggleDay  = (d: string) => setCollapsedDays((p) => ({ ...p, [d]: !p[d] }))

  // Live countdown to the next upcoming match
  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  useEffect(() => {
    const findNext = () => {
      const now = Date.now()
      return ALL_MATCHES.find((m) => {
        const [h, min] = m.time.split(":").map(Number)
        // BST = UTC+1, so subtract 60 minutes from BST to get UTC
        const ko = new Date(`${m.dateKey}T${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}:00+01:00`).getTime()
        return ko > now
      }) || null
    }
    const tick = () => {
      const match = findNext()
      setNextMatch(match)
      if (!match) { setCountdown("Tournament complete"); return }
      const [h, min] = match.time.split(":").map(Number)
      const ko = new Date(`${match.dateKey}T${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}:00+01:00`).getTime()
      const diff = ko - Date.now()
      if (diff <= 0) { setCountdown("KICK-OFF!"); return }
      const d = Math.floor(diff / 86400000)
      const hr = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${d}d ${String(hr).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const grouped = useMemo(() => {
    let filtered = ALL_MATCHES
    if (watchFilter !== "all") filtered = filtered.filter((m) => m.watch === watchFilter)
    if (teamFilter !== "all") filtered = filtered.filter((m) => m.teams.toLowerCase().includes(teamFilter.toLowerCase()))
    if (activeTab === "today") filtered = filtered.filter((m) => m.dateKey === today)
    else if (activeTab === "watchable") filtered = filtered.filter((m) => m.watch === "green")

    const map: Record<string, { date: string; dateKey: string; matches: Match[] }> = {}
    filtered.forEach((m) => {
      if (!map[m.dateKey]) map[m.dateKey] = { date: m.date, dateKey: m.dateKey, matches: [] }
      map[m.dateKey].matches.push(m)
    })
    return Object.values(map).sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [watchFilter, teamFilter, activeTab, today])

  const todayMatches = ALL_MATCHES.filter((m) => m.dateKey === today)
  const totalWatchable = ALL_MATCHES.filter((m) => m.watch === "green").length
  const filteredTeams = TEAM_LIST.filter((t) => t.toLowerCase().includes(teamSearch)).slice(0, 12)

  const icsOptions = [
    { label:"All prime-time games",  matches: ALL_MATCHES.filter((m) => m.watch === "green"),  file:"WC2026-watchable.ics" },
    { label:"England only",          matches: ALL_MATCHES.filter((m) => m.teams.includes("England")), file:"WC2026-england.ics" },
    { label:"Scotland only",         matches: ALL_MATCHES.filter((m) => m.teams.includes("Scotland")), file:"WC2026-scotland.ics" },
    { label:"Every match",           matches: ALL_MATCHES, file:"WC2026-all-matches.ics" },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--fg)] pb-20">
      {/* ── HERO ── */}
      <header className="relative overflow-hidden border-b-4 border-[var(--pitch-bright)]">
        {/* stadium bg */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/stadium-night.png)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/60 via-[var(--bg)]/75 to-[var(--bg)]" aria-hidden />
        {/* pitch stripe accent */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--pitch-bright)]" aria-hidden />

        <div className="relative mx-auto max-w-3xl px-5 pt-10 pb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--pitch-bright)]/40 bg-[var(--pitch)]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--pitch-bright)]">
            <CircleDot className="h-3 w-3" />
            FIFA World Cup 2026 · UK Viewing Guide
          </div>
          <h1 className="font-heading text-balance text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
            Watch <span className="text-[var(--pitch-bright)]">Every</span> Minute
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm text-[var(--muted)]">
            All 48 nations. 11 June – 19 July. Colour-coded by how late it&apos;ll keep you up — every kick-off in BST.
          </p>

          {/* countdown scoreboard */}
          <div className="mx-auto mt-6 inline-flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-black/40 px-6 py-4 backdrop-blur">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Next match in</span>
            <span className="font-mono text-2xl font-bold tabular-nums text-[var(--gold)] sm:text-3xl">{countdown || "—"}</span>
            <span className="text-[10px] text-[var(--muted)]">
              {nextMatch ? `${nextMatch.teams} · ${nextMatch.date} · ${nextMatch.time} BST` : "See full schedule below"}
            </span>
          </div>

          {/* ICS export */}
          <div className="relative mt-6 inline-block">
            <button
              onClick={() => setShowICSMenu((p) => !p)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--pitch-bright)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:brightness-110"
            >
              <CalendarDays className="h-4 w-4" />
              Add fixtures to calendar
            </button>
            {showICSMenu && (
              <div className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-60 -translate-x-1/2 rounded-xl border border-white/10 bg-[var(--card-bg)] p-1.5 shadow-2xl">
                {icsOptions.map((opt) => (
                  <button
                    key={opt.file}
                    onClick={() => { downloadICS(opt.matches, opt.file); setShowICSMenu(false) }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[var(--fg)] transition hover:bg-white/10"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-[var(--pitch-bright)]" />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── STATS ── */}
      <section className="mx-auto -mt-4 grid max-w-3xl grid-cols-2 gap-3 px-5 sm:grid-cols-4">
        <StatCard value={String(ALL_MATCHES.filter((m) => m.watch === "green").length)} label="Prime time" accent="text-[var(--pitch-bright)]" />
        <StatCard value={String(ALL_MATCHES.filter((m) => m.watch === "amber").length)} label="Late night" accent="text-[var(--amber)]" />
        <StatCard value={String(ALL_MATCHES.filter((m) => m.watch === "red").length)} label="Night owl" accent="text-[var(--red)]" />
        <StatCard value={String(ALL_MATCHES.length)} label="Fixtures listed" accent="text-[var(--fg)]" />
      </section>

      {/* ── LEGEND ── */}
      <section className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2 px-5">
        {[
          { w: "green" as const, icon: Tv, desc: "Ends by ~23:00" },
          { w: "amber" as const, icon: Moon, desc: "Ends ~01:00 · weekends" },
          { w: "red" as const, icon: Sunrise, desc: "After 01:00 · weekends only" },
        ].map(({ w, icon: Icon, desc }) => (
          <div key={w} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] ${WATCH[w].soft}`}>
            <Icon className={`h-3.5 w-3.5 ${WATCH[w].text}`} />
            <span className={`font-bold ${WATCH[w].text}`}>{WATCH[w].label}</span>
            <span className="text-[var(--muted)]">{desc}</span>
          </div>
        ))}
      </section>

      {/* ── TABS ── */}
      <nav className="sticky top-0 z-30 mt-5 border-y border-white/10 bg-[var(--bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-center gap-2 px-5 py-3">
          {[
            { key:"today",     label:`Today`, count: todayMatches.length },
            { key:"watchable", label:`Prime time`, count: totalWatchable },
            { key:"all",       label:"Full schedule", count: ALL_MATCHES.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); if (key !== "all") { setWatchFilter("all"); setTeamFilter("all") } }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition ${
                activeTab === key
                  ? "bg-[var(--pitch-bright)] text-[var(--ink)]"
                  : "bg-white/5 text-[var(--muted)] hover:bg-white/10"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 text-[10px] ${activeTab === key ? "bg-black/20" : "bg-white/10"}`}>{count}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── FILTERS ── */}
      {activeTab === "all" && (
        <div className="mx-auto mt-4 max-w-3xl px-5">
          <div className="rounded-xl border border-white/10 bg-[var(--card-bg)] p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                { key:"all",   label:"All" },
                { key:"green", label:"Prime time" },
                { key:"amber", label:"Late night" },
                { key:"red",   label:"Night owl" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setWatchFilter(key)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                    watchFilter === key ? "bg-[var(--pitch-bright)] text-[var(--ink)]" : "bg-white/5 text-[var(--muted)] hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-[11px] text-[var(--muted)]">Filter by team:</span>
                {teamFilter !== "all" ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/15 py-1 pl-3 pr-2">
                    <Goal className="h-3.5 w-3.5 text-[var(--gold)]" />
                    <span className="text-[12px] font-bold text-[var(--gold)]">{teamFilter}</span>
                    <button onClick={() => setTeamFilter("all")} className="text-[var(--muted)] hover:text-[var(--fg)]">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[var(--muted)]" />
                    <input
                      value={teamSearchRaw}
                      onChange={(e) => { setTeamSearch(e.target.value); setShowTeamDrop(true) }}
                      onFocus={() => setShowTeamDrop(true)}
                      placeholder="Search team…"
                      className="w-44 rounded-full border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-[12px] text-[var(--fg)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--pitch-bright)]/50"
                    />
                  </div>
                )}
              </div>
              {showTeamDrop && teamFilter === "all" && filteredTeams.length > 0 && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-40 max-h-52 w-52 overflow-y-auto rounded-lg border border-white/10 bg-[var(--card-bg)] shadow-2xl">
                  {filteredTeams.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTeamFilter(t); setTeamSearch(""); setShowTeamDrop(false) }}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[var(--fg)] transition hover:bg-white/10"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TODAY EMPTY ── */}
      {activeTab === "today" && todayMatches.length === 0 && (
        <div className="px-5 py-16 text-center text-[var(--muted)]">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p className="text-sm">No matches today. Check the full schedule for upcoming games.</p>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      <main className="mx-auto mt-4 max-w-3xl space-y-2.5 px-5">
        {grouped.map((day) => {
          const isCollapsed = collapsedDays[day.dateKey]
          const hasClash = day.matches.some((m) => m.simultaneous)
          return (
            <div key={day.dateKey}>
              {/* Day header */}
              <button
                onClick={() => toggleDay(day.dateKey)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[var(--card-bg)] px-4 py-2.5 text-left transition hover:border-white/20"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-heading text-sm font-bold uppercase tracking-wide">{day.date}</span>
                  <span className="text-[10px] text-[var(--muted)]">{day.matches.length} match{day.matches.length !== 1 ? "es" : ""}</span>
                  {hasClash && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber)]/40 bg-[var(--amber)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--amber)]">
                      <Zap className="h-3 w-3" /> clash
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {day.matches.map((m, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${WATCH[m.watch].dot}`} />
                  ))}
                  <ChevronRight className={`ml-1 h-4 w-4 text-[var(--muted)] transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
                </div>
              </button>

              {/* Matches */}
              {!isCollapsed && (
                <div className="mt-1.5 space-y-1.5">
                  {day.matches.map((match) => {
                    const factKey = `${day.dateKey}-${match.id}`
                    const factOpen = expandedFact === factKey
                    const isKnockout = ["R32","R16","QF","SF","3RD","FINAL"].includes(match.group)
                    const isFinal = match.group === "FINAL"
                    const stageLabel = isKnockout ? match.group : `Grp ${match.group}`
                    return (
                      <article
                        key={match.id}
                        className={`relative overflow-hidden rounded-xl border bg-[var(--card-bg)] pl-4 pr-3 py-3 ${
                          isFinal ? "border-[var(--gold)]/50" : match.simultaneous ? "border-[var(--amber)]/25" : "border-white/8"
                        }`}
                      >
                        {/* watch colour spine */}
                        <span className={`absolute inset-y-0 left-0 w-1 ${WATCH[match.watch].dot}`} aria-hidden />

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-1 items-start gap-3">
                            {/* kick-off time as scoreboard */}
                            <div className="flex flex-col items-center">
                              <span className={`font-mono text-base font-bold tabular-nums leading-none ${WATCH[match.watch].text}`}>
                                {match.time}
                              </span>
                              <span className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--muted)]">BST</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] font-semibold leading-snug">
                                {isFinal && <Trophy className="h-4 w-4 text-[var(--gold)]" />}
                                {match.teams}
                                {match.simultaneous && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--amber)]">
                                    <Zap className="h-3 w-3" /> simultaneous
                                  </span>
                                )}
                              </h3>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span
                                  className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                                  style={{ background: `${STAGE_COLORS[match.group] || "#64748b"}22`, color: STAGE_COLORS[match.group] || "#94a3b8" }}
                                >
                                  {stageLabel}
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
                              <button
                                onClick={() => toggleFact(factKey)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                                  factOpen
                                    ? "border-[var(--sky)]/60 bg-[var(--sky)]/20 text-[var(--sky)]"
                                    : "border-[var(--sky)]/30 bg-[var(--sky)]/10 text-[var(--sky)] hover:bg-[var(--sky)]/20"
                                }`}
                              >
                                <Info className="h-3 w-3" />
                                {factOpen ? "hide" : "fact"}
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

        {grouped.length === 0 && (
          <div className="px-5 py-16 text-center text-[var(--muted)]">
            <Search className="mx-auto mb-3 h-8 w-8 opacity-50" />
            <p className="text-sm">No matches found for your filters.</p>
          </div>
        )}
      </main>

      {/* ── FOOTER STRATEGY ── */}
      <footer className="mx-auto mt-8 max-w-3xl px-5">
        <div className="rounded-2xl border border-[var(--pitch)]/40 bg-[var(--pitch)]/8 p-5">
          <h2 className="font-heading mb-3 flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-[var(--pitch-bright)]">
            <Goal className="h-5 w-5" /> Your viewing game plan
          </h2>
          <ul className="space-y-2 text-[13px] leading-relaxed text-[var(--muted)]">
            <li><strong className="text-[var(--fg)]">Weeknights:</strong> Prime-time games (kick-offs to 21:00 BST) wrap up by 23:00 — easy on a school night.</li>
            <li><strong className="text-[var(--fg)]">Weekends:</strong> Late-night games are fair game — stay up to 01:00 and lie in. Night-owl games (02:00+) are weekend treats only.</li>
            <li><strong className="text-[var(--fg)]">Good news:</strong> Every game from the Round of 16 onwards lands in a prime BST slot. The Final kicks off 8pm BST, Sunday 19 July.</li>
            <li><strong className="text-[var(--fg)]">Export:</strong> Drop your must-watch fixtures straight into Google or Apple Calendar with the button up top.</li>
          </ul>
        </div>
        <p className="mt-4 text-center text-[10px] text-[var(--muted)]">All times BST · Fixtures and channels subject to change</p>
      </footer>
    </div>
  )
}
