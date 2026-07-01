/**
 * Configuration des prix Appartement Rose.
 *
 * Journée complète uniquement. Pas de coefficient de remise
 * (early-bird / last-minute), pas de palier de demande.
 */

/**
 * Prix de base par jour de semaine (journée complète, HT, en euros).
 *
 * Clé = valeur renvoyée par `Date.prototype.getDay()` :
 *   0 = dimanche, 1 = lundi, ... 6 = samedi.
 *
 * ⚠️ Ce sont des VALEURS PAR DÉFAUT. Elles pourront être surchargées
 * plus tard par un administrateur via le KV (Upstash Redis).
 */
export const WEEKDAY_PRICES: Record<number, number> = {
  0: 1000, // Dimanche
  1: 1000, // Lundi
  2: 1000, // Mardi
  3: 1500, // Mercredi
  4: 2000, // Jeudi
  5: 1500, // Vendredi
  6: 1000, // Samedi
};

/**
 * Tarifs Fashion Week (période spéciale — voir FASHION_WEEK_RANGES dans
 * calendar-data.ts). Priorité au-dessus de la grille jour de semaine,
 * mais en-dessous d'un prix spécial explicite (SPECIAL_DATE_PRICES) ou
 * d'un override administrateur.
 */
export const FASHION_WEEK_DAY_PRICE = 3000; // € HT / jour en Fashion Week
export const FASHION_WEEK_WEEK_PACKAGE = 15000; // € HT pour 7 jours consécutifs en Fashion Week

/**
 * Prix spéciaux par date (YYYY-MM-DD) surchargeant le prix du jour de semaine.
 * À remplir (fériés, ponts, haute saison, événements…).
 */
export const SPECIAL_DATE_PRICES: Record<string, number> = {
  // à remplir
};
