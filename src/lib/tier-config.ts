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
  0: 1500, // Dimanche
  1: 1500, // Lundi
  2: 1500, // Mardi
  3: 2000, // Mercredi
  4: 3000, // Jeudi
  5: 2500, // Vendredi
  6: 1500, // Samedi
};

/**
 * Prix spéciaux par date (YYYY-MM-DD) surchargeant le prix du jour de semaine.
 * À remplir (fériés, ponts, haute saison, événements…).
 */
export const SPECIAL_DATE_PRICES: Record<string, number> = {
  // à remplir
};
