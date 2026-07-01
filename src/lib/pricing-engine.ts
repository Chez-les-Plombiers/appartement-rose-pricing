import type { DayPricing } from "@/types";
import { WEEKDAY_PRICES, SPECIAL_DATE_PRICES } from "./tier-config";

/**
 * Moteur de prix Appartement Rose — journée complète uniquement.
 *
 * Règles (volontairement simples) :
 * - prix de base = grille par jour de semaine (WEEKDAY_PRICES) ;
 * - une date spéciale (SPECIAL_DATE_PRICES) surcharge ce prix ;
 * - AUCUN coefficient de remise (early-bird / last-minute) : le prix ne
 *   dépend jamais de la distance à aujourd'hui ;
 * - AUCUN palier de demande.
 *
 * `priceOverrides` est un point d'extension pour une future couche de
 * surcharge administrateur (KV / Upstash Redis). Il a priorité sur la
 * config statique. Par défaut, la config seule est utilisée.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Normalise une entrée `Date | string` en chaîne locale YYYY-MM-DD. */
function toDateStr(date: Date | string): string {
  if (typeof date === "string") return date;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse une chaîne YYYY-MM-DD comme date locale (minuit). */
function parseLocal(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

/**
 * Prix journée complète (HT) pour une date.
 * Priorité : priceOverrides > SPECIAL_DATE_PRICES > grille jour de semaine.
 */
export function getDayPrice(
  date: Date | string,
  priceOverrides: Record<string, number> = {},
): number {
  const dateStr = toDateStr(date);

  if (dateStr in priceOverrides) return priceOverrides[dateStr];
  if (dateStr in SPECIAL_DATE_PRICES) return SPECIAL_DATE_PRICES[dateStr];

  const dow = parseLocal(dateStr).getDay(); // 0 (dim) … 6 (sam)
  return WEEKDAY_PRICES[dow];
}

/**
 * Total (HT) pour `nbDays` jours consécutifs à partir de `startDate` (inclus).
 */
export function getMultiDayTotal(
  startDate: Date | string,
  nbDays: number,
  priceOverrides: Record<string, number> = {},
): number {
  const start = parseLocal(toDateStr(startDate));
  let total = 0;
  for (let i = 0; i < nbDays; i++) {
    const current = new Date(start.getTime() + i * MS_PER_DAY);
    total += getDayPrice(current, priceOverrides);
  }
  return total;
}

/**
 * Construit un `DayPricing` complet pour une date (journée complète).
 * `isPast` est vrai si la date est antérieure à aujourd'hui (minuit local).
 */
export function computeDayPricing(
  date: Date | string,
  options: { isBooked?: boolean } = {},
  priceOverrides: Record<string, number> = {},
): DayPricing {
  const dateStr = toDateStr(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    date: dateStr,
    price: getDayPrice(dateStr, priceOverrides),
    isBooked: options.isBooked ?? false,
    isPast: parseLocal(dateStr).getTime() < today.getTime(),
  };
}
