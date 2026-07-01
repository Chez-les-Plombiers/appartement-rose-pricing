import type { SpecialDate } from "@/types";

/**
 * Données de référence du calendrier Appartement Rose.
 *
 * Placeholders : à compléter au fil de l'eau. Chaque entrée applique
 * un prix spécial (journée complète, HT) surchargeant le prix du jour
 * de semaine défini dans `tier-config.ts` (WEEKDAY_PRICES).
 *
 * Les listes ci-dessous sont fusionnées dans `ALL_SPECIAL_DATES`, source
 * unique consommée par le moteur de prix.
 */

/** Jours fériés (ex. Noël, 1er Mai…). À remplir. */
export const JOURS_FERIES: SpecialDate[] = [
  // { date: "2026-12-25", price: 3000, label: "Noël" },
];

/** Ponts (week-ends prolongés). À remplir. */
export const PONTS: SpecialDate[] = [
  // { date: "2026-05-01", price: 2500, label: "Pont 1er Mai" },
];

/** Vacances scolaires (Zone C — Paris). À remplir. */
export const VACANCES: SpecialDate[] = [
  // { date: "2026-08-15", price: 1500, label: "Vacances d'été" },
];

/** Haute saison / événements ponctuels. À remplir. */
export const SAISON: SpecialDate[] = [
  // { date: "2026-06-21", price: 4000, label: "Fête de la Musique" },
];

/**
 * Ensemble consolidé des dates spéciales. Les doublons éventuels sont
 * résolus par la dernière entrée rencontrée (ordre : fériés → ponts →
 * vacances → saison).
 */
export const ALL_SPECIAL_DATES: readonly SpecialDate[] = [
  ...JOURS_FERIES,
  ...PONTS,
  ...VACANCES,
  ...SAISON,
];
