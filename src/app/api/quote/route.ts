import { NextResponse } from "next/server";
import { addQuote } from "@/lib/kv";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendQuoteNotification } from "@/lib/email";
import { getMultiDayTotal } from "@/lib/pricing-engine";
import type { QuoteRequest } from "@/types";

const REQUIRED_FIELDS = [
  "date",
  "firstName",
  "lastName",
  "email",
  "phone",
  "guests",
  "eventType",
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_DAYS = 7;

/** Crée une demande de devis : validation → KV → notification (best-effort). */
export async function POST(request: Request) {
  if (!(await rateLimit("rose-quote", clientIp(request), 5))) {
    return NextResponse.json(
      { success: false, error: "Trop de demandes, réessayez dans une minute" },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: "Requête invalide" },
      { status: 400 },
    );
  }

  // Champs requis
  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return NextResponse.json(
        { success: false, error: `Champ requis manquant : ${field}` },
        { status: 400 },
      );
    }
  }

  // Email
  const email = String(body.email).trim();
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { success: false, error: "Adresse email invalide" },
      { status: 400 },
    );
  }

  // Invités
  const guests = parseInt(String(body.guests), 10);
  if (!Number.isFinite(guests) || guests < 1 || guests > 200) {
    return NextResponse.json(
      { success: false, error: "Nombre d'invités invalide" },
      { status: 400 },
    );
  }

  // Nombre de jours borné 1–7 ; total recalculé côté serveur (jamais confiance au client).
  const numberOfDays = Math.min(
    Math.max(parseInt(String(body.numberOfDays), 10) || 1, 1),
    MAX_DAYS,
  );
  const date = String(body.date);
  const totalPrice = getMultiDayTotal(date, numberOfDays);

  const quote: QuoteRequest = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    firstName: String(body.firstName).trim(),
    lastName: String(body.lastName).trim(),
    email,
    phone: String(body.phone).trim(),
    company: body.company ? String(body.company).trim() : undefined,
    guests,
    eventType: String(body.eventType),
    message: body.message ? String(body.message).trim() : undefined,
    date,
    numberOfDays,
    totalPrice,
    createdAt: new Date().toISOString(),
  };

  // Persistance + notification : best-effort, non bloquant.
  await addQuote(quote).catch((err) =>
    console.error("[KV] addQuote a échoué :", err instanceof Error ? err.message : err),
  );
  await sendQuoteNotification(quote).catch((err) =>
    console.error("[Email] notification a échoué :", err instanceof Error ? err.message : err),
  );

  return NextResponse.json({ success: true, id: quote.id });
}
