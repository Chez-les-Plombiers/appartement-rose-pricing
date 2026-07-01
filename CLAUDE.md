# Appartement Rose — Calendrier de Pricing

## Projet
Calendrier de pricing public + demande de devis pour **L'Appartement Rose**, salle événementielle intimiste (100 m², jusqu'à 50 personnes) de Chez Les Plombiers, au 39 rue des Bourdonnais, 75001 Paris.

Version **simplifiée** du calendrier de Chez Les Plombiers (`pricing.chezlesplombiers.fr`), avec son **design system à l'identique** (brutaliste). Construit via les skills brainstorming → writing-plans → subagent-driven-development (docs dans `docs/plans/`).

- **Live** : https://pricing-appartement.chezlesplombiers.fr (+ alias `appartement-rose-pricing.vercel.app`)
- **GitHub** : GrowthAgence/appartement-rose-pricing (privé)
- **Vercel** : projet `appartement-rose-pricing`, team `growthagences-projects`, deploy via `vercel deploy --prod` (repo poussé sur GitHub)

## Stack
- Next.js 16 (App Router, TS strict, Turbopack)
- Tailwind v4
- Upstash Redis (`@upstash/redis`) — devis, compteur de vues, overrides de prix admin
- Resend — emails de devis
- Google Calendar API v3 — disponibilités
- Vitest — tests unitaires (logique de prix + parsing calendrier)
- Radix Dialog, Lucide, clsx/tailwind-merge

## Design system (identique CLP)
- Brutaliste : brass `#C8A96E`, charcoal `#1A1A1A`, **no border-radius**
- Fonts : Space Mono (titres/UI) + Inter (corps)
- Tokens dans `src/app/globals.css` ; helper `cn` dans `src/lib/utils.ts`

## Tarification
Grille par jour de semaine (HT, journée entière), dans `src/lib/tier-config.ts` :
- Lun/Mar/Sam/Dim = **1000 €** · Mer/Ven = **1500 €** · Jeu = **2000 €**
- **Fashion Week = 3000 €/jour**, **forfait 7 jours consécutifs = 15 000 €** (`FASHION_WEEK_DAY_PRICE` / `FASHION_WEEK_WEEK_PACKAGE`, périodes dans `calendar-data.ts` → `FASHION_WEEK_RANGES` / `isFashionWeek`)

**Priorité de prix** (`src/lib/pricing-engine.ts`) : override de date (admin/KV) > `SPECIAL_DATE_PRICES` > Fashion Week > (override jour-de-semaine admin ?? grille par défaut). Pas de coefficient dégressif, pas de demi-journée, pas de heatmap de demande.

## Architecture
```
src/
├── app/
│   ├── page.tsx                 # Calendrier public (Server Component, force-dynamic)
│   ├── layout.tsx               # Fonts + GA4/Clarity conditionnels
│   ├── globals.css              # Design system
│   ├── admin/                   # Admin (page.tsx + client.tsx) — password-gated
│   └── api/
│       ├── quote/route.ts       # POST devis → KV + Resend
│       ├── analytics/route.ts   # POST incrément vues
│       └── admin/               # auth, prices, quotes
├── components/                  # CalendarHeatmap, MonthGrid, DayCell, DayModal,
│                                # MonthNavigator, QuoteForm, Navbar, Footer,
│                                # AdminLogin, AdminPriceEditor, AdminLeadsList
├── lib/
│   ├── pricing-engine.ts        # getDayPrice, getMultiDayTotal, computeDayPricing (33 tests)
│   ├── tier-config.ts           # grille prix + Fashion Week
│   ├── calendar-data.ts         # dates spéciales + FASHION_WEEK_RANGES + isFashionWeek
│   ├── google-calendar.ts       # getBookedDays (journée entière, fallback vide si erreur)
│   ├── kv.ts                    # Upstash : quotes, day-views, price-config (clés préfixées rose:)
│   ├── email.ts                 # Resend sendQuoteNotification
│   ├── analytics.ts             # trackEvent / trackDayClick
│   └── date-utils.ts, utils.ts
└── types/index.ts               # DayPricing, SpecialDate, QuoteRequest
```

## Fonctionnalités
- Calendrier 12 mois glissant, prix par jour, popup détail au clic (journée entière)
- Réservation multi-jours (1–7 jours) avec total live (forfait FW appliqué automatiquement)
- Dispos via Google Calendar dédié (jours réservés/passés grisés « Réservé »)
- Devis (formulaire allégé, sans SIRET) → stockage KV + email Resend
- **Admin `/admin`** : édition grille de prix + overrides par date, liste des demandes de devis
- Analytics GA4 + Clarity (optionnels, chargés seulement si les IDs sont présents)
- Français uniquement

## Disponibilités — Google Calendar
- Source : **agenda Google dédié, rendu PUBLIC** (une clé API ne lit que les agendas publics)
- `GOOGLE_CALENDAR_ID` = `c_4342e6b51a4e3714a58db11f59b477f2f57585dd0624d97dac8d8b559f368a16@group.calendar.google.com`
- `GOOGLE_CALENDAR_API_KEY` = clé réutilisée de CLP (projet GCP chez-les-plombiers-490515)
- Tout événement sur un jour = jour réservé (all-day event `end.date` exclusif). Fallback « tout dispo » si l'agenda est inaccessible.

## Env vars (Vercel prod)
| Variable | Rôle |
|----------|------|
| `GOOGLE_CALENDAR_ID` / `GOOGLE_CALENDAR_API_KEY` | Dispos |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash (store CLP réutilisé, clés `rose:`) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Emails devis (réutilise CLP, from `notifications@chezlesplombiers.fr`) |
| `ADMIN_PASSWORD` | Accès `/admin` — actuel : `Blopblop2023!` |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_CLARITY_ID` | Analytics (⏳ à créer, dédiés) |

Voir `.env.example`. Sans env vars, le site tourne en mode dégradé (dispos ouvertes, devis/analytics no-op) — build OK sans secrets.

## Devis
- Destinataires email : etienne@ / celine@ / frederic@chezlesplombiers.fr
- Stockés dans KV (clé `rose:quotes`), visibles dans l'admin onglet « Demandes »

## Intégration site CLP
La page `chezlesplombiers.fr/appartement` a 2 CTA dans le hero : **« Visiter le lieu »** → Calendly, **« Réserver l'Appartement Rose »** → ce calendrier (via `EXTERNAL_LINKS.pricingAppartement` dans le repo CLP).

## Commandes
```bash
npm run dev      # dev
npm run build    # build prod
npm run lint     # eslint
npm run test     # vitest
vercel deploy --prod --yes --scope growthagences-projects   # déploiement
```

## Conventions
- Server components par défaut, `"use client"` si état/hooks
- TS strict, pas de `any`, patterns immutables
- Clés KV préfixées `rose:` (cohabitation sûre avec CLP dans le même store Upstash)
- Toujours `npm run lint` + `npm run test` avant commit

## TODO
- Analytics GA4 + Clarity dédiés (créer les propriétés, poser les IDs)
- Remplir d'éventuelles dates spéciales (fériés/ponts) dans `calendar-data.ts`
