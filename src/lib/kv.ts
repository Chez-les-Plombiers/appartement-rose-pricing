import { Redis } from "@upstash/redis";
import type { QuoteRequest } from "@/types";

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
