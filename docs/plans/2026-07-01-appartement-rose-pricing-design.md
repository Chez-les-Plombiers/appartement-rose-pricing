# Design — Calendrier Pricing Appartement Rose

Date : 2026-07-01
Statut : validé (approche B, design system CLP conservé)

## Contexte

L'Appartement Rose est une salle événementielle de Chez Les Plombiers (page `chezlesplombiers.fr/appartement`). On lui crée un calendrier de pricing public, sur le modèle de celui de Chez Les Plombiers (`pricing.chezlesplombiers.fr`), mais **en plus simple**.

- **Approche retenue : B** — nouveau repo propre + portage sélectif et simplifié des composants du calendrier CLP (pas de fork brut, pas de code mort).
- **Design system : identique à CLP** — brutaliste, brass `#C8A96E` / charcoal `#1A1A1A`, Space Mono (titres/boutons) + Inter (corps), no border-radius. On réutilise `tier-config`/`globals.css` du calendrier CLP.

## Scope

### Gardé
- Calendrier multi-mois en fenêtre glissante (12 mois à partir du mois courant)
- Grille mois Lun→Dim, navigateur de mois mobile
- Affichage prix par jour + popup détail au clic (CTA « Devis »)
- **Journée complète uniquement** (pas de demi-journées)
- **Grille de tarification par jour de semaine** (Lun→Dim, HT) éditable en config
- **Dates spéciales** (fériés, ponts, vacances, saison) affectant le prix, éditables en config
- **Réservation multi-jours** (1 à 7 jours consécutifs) avec total calculé
- **Disponibilités via Google Calendar dédié** (jours réservés grisés/non cliquables), + jours passés grisés
- Formulaire de devis simplifié → stockage KV + email Resend
- **Analytics** : GA4 + Microsoft Clarity + compteur de vues interne (KV)
- Responsive mobile, français uniquement

### Retiré (par rapport à CLP)
- Demi-journées (matin/après-midi) → journée entière seulement
- Tarifs dégressifs early-bird/last-minute + badge « -% »
- Heatmap couleurs par niveau de demande + légende (rendu visuel neutre)
- Champs B2B : autocomplete SIRENE, SIRET, client final
- Sync CRM Pipedrive, webhooks Calendly/n8n, export ICS
- Admin lourd CLP : bulk editor, projections, dashboard finances/Pennylane
- Système de gate/access-code legacy

### Admin minimal (ajouté 2026-07-01)
- Admin password-gated (`ADMIN_PASSWORD`) : **édition de la grille de prix** (défauts config surchargés par overrides KV) + overrides par date, et **liste des devis reçus** (leads = fallback des gens qui remplissent le formulaire).
- Grille de prix par défaut (HT) : Lun 1500, Mar 1500, Mer 2000, Jeu 3000, Ven 2500, Sam 1500, Dim 1500.

## Architecture

- **Repo** : `appartement-rose-pricing` (GitHub GrowthAgence), nouveau.
- **Deploy** : Vercel, domaine cible `pricing-appartement.chezlesplombiers.fr` (à confirmer au déploiement — doit contenir « pricing », même famille que `chezlesplombiers.fr`).
- **Stack** : Next.js 16 (App Router, TS strict), Tailwind v4, Upstash Redis (KV), Resend, Google Calendar API. Identique à la stack du calendrier CLP.
- **Pages** : `/` (calendrier public) uniquement. Pas d'admin.

### Composants (portés du calendrier CLP, simplifiés)
- `CalendarHeatmap` → `MonthGrid` → `DayCell` (cellule pleine journée, sans split gauche/droite) → `DayModal` (prix journée + CTA devis)
- `MonthNavigator` (mobile), `Navbar`, `Footer`
- `QuoteForm` allégé (sans SIRET/SIRENE ; multi-jours conservé)

### Logique (`src/lib`)
- `pricing-engine.ts` : grille 7 jours + dates spéciales, **sans** coefficient dégressif ni ratio demi-journée
- `calendar-data.ts` : dates spéciales éditables (fériés, ponts, vacances, saison)
- `tier-config.ts` : grille de prix Lun→Dim + prix des dates spéciales (config centrale)
- `google-calendar.ts` : lecture des dispos (journée entière) depuis l'agenda dédié
- `kv.ts` : stockage devis + compteur de vues
- `email.ts` : notification Resend → etienne@, celine@, frederic@chezlesplombiers.fr

### API
- `POST /api/quote` : validation → stockage KV → email Resend. Réponse `{success,id}`.
- `POST /api/analytics` : incrément compteur de vues (best-effort).

## Data flow

1. `page.tsx` (Server Component, `force-dynamic`) calcule la fenêtre 12 mois.
2. Merge : grille de prix (config) + dates spéciales (config) + disponibilités (Google Calendar).
3. Rendu du calendrier ; clic sur un jour → `DayModal` avec prix journée.
4. Devis : `QuoteForm` → `POST /api/quote` → KV + email.

## Erreurs / robustesse

- Google Calendar indisponible → fallback « tout disponible » (best-effort, `cache: no-store`), jamais de crash SSR.
- Email/KV en échec → non-bloquant pour l'utilisateur, la demande de devis renvoie quand même un succès UI (comme CLP), erreurs loguées serveur.
- Validation devis côté client (HTML required) + serveur (champs requis + regex email).

## Config à fournir (Fred)

- Les 7 prix journée HT (Lun→Dim) pour l'Appartement Rose
- Les dates spéciales et leur prix (fériés/ponts/vacances/saison) si applicable
- `GOOGLE_CALENDAR_ID` + `GOOGLE_CALENDAR_API_KEY` de l'agenda dédié Appartement Rose
- Nom/adresse/superficie du lieu pour Navbar + Footer
- Confirmation du sous-domaine de déploiement

## Env vars

`KV_REST_API_URL`, `KV_REST_API_TOKEN`, `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

## Suite

1. Écrire ce design doc + commit (fait).
2. `writing-plans` : plan d'implémentation détaillé.
3. Structuration GSD + relecture du plan (autoplan / sous-agents).
4. Build avec sous-agents.
