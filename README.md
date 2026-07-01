# Appartement Rose — Calendrier de pricing

Calendrier de pricing public + demande de devis pour l'Appartement Rose (salle événementielle de Chez Les Plombiers). Version simplifiée du calendrier de `pricing.chezlesplombiers.fr`, même design system (brutaliste brass/charcoal, Space Mono + Inter).

## Stack
Next.js 16 (App Router, TS strict) · Tailwind v4 · Upstash Redis (KV) · Resend · Google Calendar API · Vitest.

## Fonctionnalités
- Calendrier 12 mois glissant, prix par jour (journée complète).
- Grille par jour de semaine + dates spéciales + **Fashion Week** (3000 €/jour, forfait semaine 15 000 €).
- Réservation multi-jours (1–7 jours) avec total.
- Disponibilités via Google Calendar dédié (jours réservés/passés grisés).
- Devis → stockage KV + email Resend (etienne@/celine@/frederic@chezlesplombiers.fr).
- **Admin** `/admin` (mot de passe) : édition de la grille de prix + overrides par date, liste des demandes de devis.
- Analytics GA4 + Microsoft Clarity (optionnels).

## Développement
```bash
npm install
cp .env.example .env.local   # remplir les valeurs (voir ci-dessous)
npm run dev
npm run test    # vitest
npm run lint
npm run build
```
Sans variables d'environnement, le site fonctionne en mode dégradé (dispos = tout ouvert, devis/analytics no-op) — utile en local.

## Configuration à fournir (⚠️ avant mise en prod)
1. **Prix** : grille par défaut dans `src/lib/tier-config.ts` (Lun/Mar/Sam/Dim 1000, Mer/Ven 1500, Jeu 2000 ; Fashion Week 3000/j, 15 000 €/semaine). Modifiable ensuite en direct via l'admin.
2. **Dates spéciales** : `src/lib/calendar-data.ts` (fériés/ponts/vacances/saison + périodes Fashion Week).
3. **Google Calendar** : `GOOGLE_CALENDAR_ID` + `GOOGLE_CALENDAR_API_KEY` de l'agenda dédié.
4. **Infos du lieu** : adresse + superficie dans `src/components/Footer.tsx` (placeholders « à fournir »).
5. **Env** : voir `.env.example` (KV, Resend, ADMIN_PASSWORD, GA/Clarity).
6. **Déploiement** : Vercel, sous-domaine cible `pricing-appartement.chezlesplombiers.fr` (à confirmer).

## Docs
- `docs/plans/2026-07-01-appartement-rose-pricing-design.md` — design validé
- `docs/plans/2026-07-01-appartement-rose-pricing-plan.md` — plan d'implémentation
