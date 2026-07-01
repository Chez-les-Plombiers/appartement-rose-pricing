import { NextResponse } from "next/server";
import { getPriceConfig, setPriceConfig, type StoredPriceConfig } from "@/lib/kv";
import { isAuthorizedAdmin } from "@/lib/admin-auth";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PRICE = 1_000_000; // garde-fou : prix HT en euros

/** Un montant est-il un prix valide (entier positif borné) ? */
function isValidPrice(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= MAX_PRICE
  );
}

/**
 * Valide et normalise un corps de requête en StoredPriceConfig.
 * Renvoie `null` si le format est invalide.
 */
function parseConfig(body: unknown): StoredPriceConfig | null {
  if (typeof body !== "object" || body === null) return null;
  const { weekdayOverrides, dateOverrides } = body as Record<string, unknown>;

  const weekday: Record<number, number> = {};
  if (weekdayOverrides !== undefined) {
    if (typeof weekdayOverrides !== "object" || weekdayOverrides === null) return null;
    for (const [key, value] of Object.entries(weekdayOverrides)) {
      const dow = Number(key);
      if (!Number.isInteger(dow) || dow < 0 || dow > 6) return null;
      if (!isValidPrice(value)) return null;
      weekday[dow] = value;
    }
  }

  const dates: Record<string, number> = {};
  if (dateOverrides !== undefined) {
    if (typeof dateOverrides !== "object" || dateOverrides === null) return null;
    for (const [key, value] of Object.entries(dateOverrides)) {
      if (!DATE_REGEX.test(key)) return null;
      if (!isValidPrice(value)) return null;
      dates[key] = value;
    }
  }

  return { weekdayOverrides: weekday, dateOverrides: dates };
}

/** Renvoie la configuration de prix courante (admin uniquement). */
export async function GET(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const config = await getPriceConfig();
  return NextResponse.json(config);
}

/** Enregistre la configuration de prix (admin uniquement). */
export async function POST(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const config = parseConfig(body);
  if (!config) {
    return NextResponse.json(
      { error: "Configuration de prix invalide" },
      { status: 400 },
    );
  }

  await setPriceConfig(config);
  return NextResponse.json({ success: true, config });
}
