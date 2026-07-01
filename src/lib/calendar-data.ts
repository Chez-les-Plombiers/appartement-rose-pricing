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

/**
 * Périodes Fashion Week Paris (bornes incluses, YYYY-MM-DD).
 * En Fashion Week : 3000 €/jour, ou 15 000 € le forfait 7 jours consécutifs
 * (voir FASHION_WEEK_DAY_PRICE / FASHION_WEEK_WEEK_PACKAGE dans tier-config.ts).
 * Dates FHCM 2027 estimées — à confirmer.
 */
export const FASHION_WEEK_RANGES: readonly [string, string, string][] = [
  ["2026-01-20", "2026-01-25", "Fashion Week Homme"],
  ["2026-01-26", "2026-01-29", "Haute Couture"],
  ["2026-03-02", "2026-03-10", "Fashion Week Femme PAP"],
  ["2026-06-23", "2026-06-28", "Fashion Week Homme"],
  ["2026-07-06", "2026-07-09", "Haute Couture"],
  ["2026-09-28", "2026-10-06", "Fashion Week Femme PAP"],
  ["2027-01-19", "2027-01-24", "Fashion Week Homme"],
  ["2027-01-25", "2027-01-28", "Haute Couture"],
  ["2027-03-01", "2027-03-09", "Fashion Week Femme PAP"],
  ["2027-06-22", "2027-06-27", "Fashion Week Homme"],
  ["2027-07-05", "2027-07-08", "Haute Couture"],
  ["2027-09-27", "2027-10-05", "Fashion Week Femme PAP"],
];

/** Vrai si la date (YYYY-MM-DD) tombe dans une période Fashion Week. */
export function isFashionWeek(dateStr: string): boolean {
  return FASHION_WEEK_RANGES.some(([start, end]) => dateStr >= start && dateStr <= end);
}
