import type { DayPricing } from "@/types";
import {
  WEEKDAY_PRICES,
  SPECIAL_DATE_PRICES,
  FASHION_WEEK_DAY_PRICE,
  FASHION_WEEK_WEEK_PACKAGE,
} from "./tier-config";
import { isFashionWeek } from "./calendar-data";

/**
 * Moteur de prix Appartement Rose — journée complète uniquement.
 *
 * Règles (volontairement simples) :
 * - prix de base = grille par jour de semaine (WEEKDAY_PRICES) ;
 * - une date spéciale (SPECIAL_DATE_PRICES) surcharge ce prix ;
 * - en Fashion Week : 3000 €/jour, ou 15 000 € le forfait 7 jours consécutifs ;
 * - AUCUN coefficient de remise (early-bird / last-minute) : le prix ne
 *   dépend jamais de la distance à aujourd'hui ;
 * - AUCUN palier de demande.
 *
 * Priorité de prix : dateOverrides (admin/KV) > SPECIAL_DATE_PRICES >
 * Fashion Week > (weekdayOverrides admin/KV ?? grille jour de semaine).
 *
 * Les surcharges administrateur (KV / Upstash Redis) se déclinent en deux
 * niveaux : surcharge par date précise (`dateOverrides`) et surcharge de la
 * grille par jour de semaine (`weekdayOverrides`). Par défaut, la config seule
 * est utilisée.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Surcharges administrateur des prix (stockées en KV).
 * - `dateOverrides` : date YYYY-MM-DD → prix (priorité maximale) ;
 * - `weekdayOverrides` : jour de semaine (0 = dim … 6 = sam) → prix, se
 *   substituant à la grille WEEKDAY_PRICES par défaut.
 */
export interface PriceConfig {
  dateOverrides?: Record<string, number>;
  weekdayOverrides?: Record<number, number>;
}

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
 * Une date a-t-elle un prix explicite (override de date ou date spéciale) ?
 * Un override de jour de semaine n'est PAS considéré comme explicite : la
 * Fashion Week reste prioritaire dessus (y compris pour le forfait semaine).
 */
function hasExplicitPrice(
  dateStr: string,
  dateOverrides: Record<string, number>,
): boolean {
  return dateStr in dateOverrides || dateStr in SPECIAL_DATE_PRICES;
}

/**
 * Prix journée complète (HT) pour une date.
 * Priorité : dateOverrides > SPECIAL_DATE_PRICES > Fashion Week >
 * (weekdayOverrides ?? grille jour de semaine).
 */
export function getDayPrice(
  date: Date | string,
  config: PriceConfig = {},
): number {
  const dateStr = toDateStr(date);
  const dateOverrides = config.dateOverrides ?? {};
  const weekdayOverrides = config.weekdayOverrides ?? {};

  if (dateStr in dateOverrides) return dateOverrides[dateStr];
  if (dateStr in SPECIAL_DATE_PRICES) return SPECIAL_DATE_PRICES[dateStr];
  if (isFashionWeek(dateStr)) return FASHION_WEEK_DAY_PRICE;

  const dow = parseLocal(dateStr).getDay(); // 0 (dim) … 6 (sam)
  return weekdayOverrides[dow] ?? WEEKDAY_PRICES[dow];
}

/**
 * Total (HT) pour `nbDays` jours consécutifs à partir de `startDate` (inclus).
 *
 * Cas spécial Fashion Week : 7 jours consécutifs entièrement en Fashion Week,
 * sans prix explicite (override/date spéciale) sur aucun de ces jours, bénéficient
 * du forfait semaine (FASHION_WEEK_WEEK_PACKAGE = 15 000 €) au lieu de 7 × 3000.
 */
export function getMultiDayTotal(
  startDate: Date | string,
  nbDays: number,
  config: PriceConfig = {},
): number {
  const start = parseLocal(toDateStr(startDate));
  const dateOverrides = config.dateOverrides ?? {};
  const dayStrs: string[] = [];
  for (let i = 0; i < nbDays; i++) {
    dayStrs.push(toDateStr(new Date(start.getTime() + i * MS_PER_DAY)));
  }

  // Forfait semaine Fashion Week : 7 jours, tous en FW, aucun prix explicite.
  const isFashionWeekPackage =
    nbDays === 7 &&
    dayStrs.every((d) => isFashionWeek(d) && !hasExplicitPrice(d, dateOverrides));
  if (isFashionWeekPackage) return FASHION_WEEK_WEEK_PACKAGE;

  return dayStrs.reduce((total, d) => total + getDayPrice(d, config), 0);
}

/**
 * Construit un `DayPricing` complet pour une date (journée complète).
 * `isPast` est vrai si la date est antérieure à aujourd'hui (minuit local).
 */
export function computeDayPricing(
  date: Date | string,
  options: { isBooked?: boolean } = {},
  config: PriceConfig = {},
): DayPricing {
  const dateStr = toDateStr(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    date: dateStr,
    price: getDayPrice(dateStr, config),
    isBooked: options.isBooked ?? false,
    isPast: parseLocal(dateStr).getTime() < today.getTime(),
  };
}
