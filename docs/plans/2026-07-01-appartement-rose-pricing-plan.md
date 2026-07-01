# Calendrier Pricing Appartement Rose — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construire un calendrier de pricing public pour l'Appartement Rose, version simplifiée du calendrier Chez Les Plombiers, dans un nouveau repo.

**Architecture:** Next.js 16 App Router, une seule page publique `/` (Server Component `force-dynamic`) qui merge une grille de prix par jour de semaine + dates spéciales (config) avec les disponibilités d'un Google Calendar dédié, puis affiche un calendrier 12 mois glissant. Devis via `/api/quote` → Upstash KV + email Resend. Design system porté à l'identique du calendrier CLP (brutaliste, brass/charcoal, Space Mono + Inter). Approche B : portage sélectif et simplifié des composants CLP, pas de fork brut.

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind v4, Upstash Redis (`@upstash/redis`), Resend, Google Calendar API v3, Vitest (tests unitaires logique pure).

**Repo source à porter :** `/Users/fred/chez-les-plombiers-pricing` (lire les fichiers cités, adapter en simplifiant selon le scope). Repo cible : `/Users/fred/appartement-rose-pricing`.

**Simplifications systématiques vs CLP (à appliquer dans tout portage) :**
- Supprimer demi-journées (matin/après-midi) → journée entière uniquement
- Supprimer coefficients dégressifs (early-bird/last-minute) et `SaveBadge`
- Supprimer heatmap tiers + `TierLegend` → rendu visuel neutre (mais garder les tokens de couleur du design system)
- Supprimer SIRENE/SIRET/client final du formulaire
- Supprimer Pipedrive, Calendly, ICS, n8n, tout l'admin, le gate legacy

---

## Phase 0 — Scaffold & design system

### Task 0.1: Scaffolder le projet Next.js
**Files:** Create repo files (package.json, tsconfig, next.config, tailwind/postcss, app/layout, app/page placeholder)
**Steps:**
1. `cd /Users/fred/appartement-rose-pricing`
2. Scaffolder Next 16 + TS + Tailwind v4 (aligner versions sur le `package.json` de CLP pricing pour cohérence). Installer deps runtime : `@upstash/redis resend`. Dev : `vitest @vitejs/plugin-react`.
3. Vérifier `npm run build` sur le scaffold vide.
4. Commit : `chore: scaffold Next.js 16 + tailwind v4 + deps`

### Task 0.2: Porter le design system CLP
**Files:** Create `src/app/globals.css`, `src/lib/utils.ts` (cn), fonts dans `layout.tsx`
**Steps:**
1. Copier `globals.css` de CLP pricing (theme brutaliste : brass `#C8A96E`, charcoal `#1A1A1A`, no-radius, tokens couleur). Copier `utils.ts` (`cn`).
2. Configurer Space Mono + Inter (comme CLP) dans `layout.tsx`, `<html lang="fr">`.
3. Build + commit : `feat: design system CLP (brutaliste brass/charcoal, Space Mono+Inter)`

---

## Phase 1 — Config & moteur de prix (TDD)

### Task 1.1: Config prix + dates spéciales
**Files:** Create `src/lib/tier-config.ts`, `src/lib/calendar-data.ts`, `src/types/index.ts`
**Steps:**
1. `tier-config.ts` : `WEEKDAY_PRICES` (grille Lun→Dim, HT, valeurs placeholder + commentaire « À FOURNIR PAR FRED »), `SPECIAL_DATE_PRICES` (map date→prix). PAS de `HALF_DAY_RATIO`, PAS de coeffs booking-window.
2. `calendar-data.ts` : listes dates spéciales (fériés/ponts/vacances/saison) éditables, placeholder.
3. `types/index.ts` : `DayPricing`, `QuoteRequest`, `SpecialDate` (versions simplifiées, journée seule).
4. Commit : `feat: config prix par jour de semaine + dates spéciales`

### Task 1.2: pricing-engine (TDD)
**Files:** Create `src/lib/pricing-engine.ts`, Test `src/lib/pricing-engine.test.ts`
**Step 1 — tests d'abord :**
```ts
// getDayPrice: prix selon jour de semaine
expect(getDayPrice(new Date('2026-07-06'))).toBe(WEEKDAY_PRICES.monday) // lundi
// date spéciale override le jour de semaine
expect(getDayPrice(new Date(SPECIAL_DATE)).price).toBe(SPECIAL_DATE_PRICES[SPECIAL_DATE])
// multi-jours : somme des jours
expect(getMultiDayTotal(start, 3)).toBe(sum of 3 day prices)
// pas de coefficient dégressif : prix identique quelle que soit la distance à aujourd'hui
```
**Step 2:** `vitest run pricing-engine` → FAIL
**Step 3:** Implémenter `getDayPrice(date)`, `getMultiDayTotal(startDate, nbDays)`, `computeDayPricing(date, availability)` (journée entière ; merge dispo). Adapter depuis `pricing-engine.ts` CLP en retirant `HALF_DAY_RATIO`/`getBookingWindow`/tiers.
**Step 4:** `vitest run` → PASS
**Step 5:** Commit : `feat: moteur de prix (grille jour + dates spéciales + multi-jours), TDD`

---

## Phase 2 — Disponibilités Google Calendar (TDD sur le parsing)

### Task 2.1: google-calendar lib
**Files:** Create `src/lib/google-calendar.ts`, Test `src/lib/google-calendar.test.ts`
**Steps:**
1. Tests sur la fonction de mapping events→jours réservés (journée entière : all-day event OU event couvrant la journée → jour réservé). Simplifier : pas de demi-journée.
2. FAIL → implémenter (porter de CLP `google-calendar.ts`, garder fetch v3 `timeZone=Europe/Paris`, `cache:no-store`, fallback vide si erreur ; retirer la logique matin/après-midi).
3. PASS → Commit : `feat: dispos Google Calendar (journée entière), TDD parsing`

---

## Phase 3 — UI calendrier (build + visuel)

### Task 3.1: DayCell (pleine journée)
**Files:** Create `src/components/DayCell.tsx`
Porter `DayCell` CLP en retirant le split gauche/droite : une cellule pleine, prix du jour, grisée si passé/réservé, cliquable sinon. Rendu neutre (tokens couleur du design system, pas de tiers demande). Build + commit.

### Task 3.2: MonthGrid + MonthNavigator
**Files:** Create `src/components/MonthGrid.tsx`, `src/components/MonthNavigator.tsx`
Grille 7 colonnes Lun→Dim + headers, offsets. Navigateur mobile (quick-jump + smooth scroll). Build + commit.

### Task 3.3: DayModal (Radix dialog)
**Files:** Create `src/components/DayModal.tsx` (+ `@radix-ui/react-dialog`)
Modal : date + prix journée + CTA « Devis » (ouvre QuoteForm). Retirer l'affichage multi-slots. Build + commit.

### Task 3.4: CalendarHeatmap (assemblage) + Navbar + Footer
**Files:** Create `src/components/CalendarHeatmap.tsx`, `Navbar.tsx`, `Footer.tsx`
Assemble MonthGrid × 12 mois, gère l'état modal. Navbar (logo → chezlesplombiers.fr, titre « Appartement Rose — Tarifs »), Footer (adresse/superficie placeholder « À FOURNIR »). Build + commit.

---

## Phase 4 — Devis (KV + email)

### Task 4.1: kv.ts + email.ts
**Files:** Create `src/lib/kv.ts`, `src/lib/email.ts`
Porter `kv.ts` (Upstash, `addQuote`, `incrementDayView`) et `email.ts` (Resend, destinataires etienne@/celine@/frederic@chezlesplombiers.fr, `RESEND_FROM_EMAIL`) de CLP, retirer ce qui touche finances/overrides admin. Build + commit.

### Task 4.2: QuoteForm simplifié
**Files:** Create `src/components/QuoteForm.tsx`
Champs : Prénom*, Nom*, Email*, Téléphone*, Entreprise (optionnel), Nb invités*, Type d'événement*, Message. Multi-jours (1-7) avec total live via `getMultiDayTotal`. PAS de SIRENE/SIRET/client final. Build + commit.

### Task 4.3: /api/quote (TDD validation)
**Files:** Create `src/app/api/quote/route.ts`, Test `src/app/api/quote/route.test.ts`
Tests : champs requis manquants → 400 ; email invalide → 400 ; payload valide → `{success,id}` (mock KV/email). Implémenter : validation serveur → `addQuote` → `sendQuoteNotification` (non-bloquant). Commit : `feat: API devis (validation + KV + Resend), TDD`

---

## Phase 5 — Analytics

### Task 5.1: GA4 + Clarity + compteur vues
**Files:** Modify `src/app/layout.tsx`, Create `src/app/api/analytics/route.ts`, `src/lib/analytics.ts`
GA4 + Microsoft Clarity via `next/script` (IDs en placeholder « À FOURNIR » ou env). `POST /api/analytics` incrémente le compteur KV. Events client : `calendar_day_click`, `quote_form_open`, `quote_form_submit`. Build + commit.

---

## Phase 6 — Wiring SSR & finalisation

### Task 6.1: page.tsx (SSR merge)
**Files:** Create/Modify `src/app/page.tsx`
Server Component `force-dynamic` : fenêtre 12 mois → merge grille prix + dates spéciales + dispos Google Calendar → rendu `CalendarHeatmap`. Bandeau « prix indicatifs HT ». Build + commit.

### Task 6.2: Lint, build final, README, env
**Files:** Create `.env.example`, `README.md`, Modify `CLAUDE.md`
`.env.example` (KV, GOOGLE_CALENDAR_*, RESEND_*). README (config à remplir : 7 prix, dates spéciales, calendar id, infos lieu, sous-domaine). `npm run lint` + `npm run build` verts. Commit : `docs: README + env example`

### Task 6.3: Push GitHub
Créer le repo `GrowthAgence/appartement-rose-pricing`, push `main`. (Deploy Vercel + sous-domaine `pricing-appartement.chezlesplombiers.fr` = étape manuelle à valider avec Fred.)

---

## Config à fournir par Fred avant mise en prod
- 7 prix journée HT (Lun→Dim) + dates spéciales et leurs prix
- `GOOGLE_CALENDAR_ID` + `GOOGLE_CALENDAR_API_KEY` (agenda dédié Appartement Rose)
- IDs GA4 + Clarity (ou réutiliser ceux de CLP ?)
- Nom/adresse/superficie du lieu (Navbar/Footer)
- Sous-domaine de déploiement définitif
