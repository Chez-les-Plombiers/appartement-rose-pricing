import { Redis } from "@upstash/redis";
import type { QuoteRequest } from "@/types";
import type { PriceConfig } from "./pricing-engine";

/**
 * Accès Upstash Redis. Si les variables d'environnement manquent, toutes les
 * fonctions deviennent des no-op renvoyant des valeurs sûres — on ne lève
 * jamais d'exception (l'environnement de build/dev n'a pas ces variables).
 */
function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const QUOTES_KEY = "rose:quotes";
const DAY_VIEWS_KEY = "rose:day-views";
const PRICE_CONFIG_KEY = "rose:price-config";

/**
 * Configuration de prix administrateur telle que persistée en KV : les deux
 * niveaux de surcharge sont toujours présents (objets vides par défaut).
 */
export type StoredPriceConfig = Required<PriceConfig>;

const EMPTY_PRICE_CONFIG: StoredPriceConfig = {
  weekdayOverrides: {},
  dateOverrides: {},
};

/**
 * Renvoie la configuration de prix administrateur (surcharges par jour de
 * semaine et par date). Objets vides si KV indisponible ou config absente.
 */
export async function getPriceConfig(): Promise<StoredPriceConfig> {
  const redis = getRedis();
  if (!redis) return EMPTY_PRICE_CONFIG;
  const data = await redis.get<StoredPriceConfig>(PRICE_CONFIG_KEY);
  return {
    weekdayOverrides: data?.weekdayOverrides ?? {},
    dateOverrides: data?.dateOverrides ?? {},
  };
}

/** Enregistre la configuration de prix administrateur. No-op si KV absent. */
export async function setPriceConfig(config: StoredPriceConfig): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(PRICE_CONFIG_KEY, config);
}

/** Enregistre une demande de devis (la plus récente en tête). Immuable. */
export async function addQuote(quote: QuoteRequest): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const quotes = await getQuotes();
  await redis.set(QUOTES_KEY, [quote, ...quotes]);
}

/** Renvoie toutes les demandes de devis (vide si KV indisponible). */
export async function getQuotes(): Promise<QuoteRequest[]> {
  const redis = getRedis();
  if (!redis) return [];
  const data = await redis.get<QuoteRequest[]>(QUOTES_KEY);
  return data ?? [];
}

/** Incrémente le compteur de vues d'un jour (analytics légères). No-op si KV absent. */
export async function incrementDayView(dateStr: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.hincrby(DAY_VIEWS_KEY, dateStr, 1);
}
