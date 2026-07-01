"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import type { DayPricing } from "@/types";
import { formatDateFR, formatPrice, addDaysStr } from "@/lib/date-utils";
import { getMultiDayTotal, getDayPrice } from "@/lib/pricing-engine";
import { trackEvent } from "@/lib/analytics";

interface QuoteFormProps {
  day: DayPricing;
  allDays: DayPricing[];
  onBack: () => void;
  onSuccess: () => void;
}

const EVENT_TYPES = [
  "Défilé / Fashion show",
  "Lancement produit",
  "Cocktail / Soirée",
  "Petit-déjeuner",
  "Tournage / Shooting",
  "Conférence / Séminaire",
  "Formation",
  "Exposition",
  "Pop-up store",
  "Autre",
];

const MAX_DAYS = 7;
const MAX_GUESTS = 200;

/**
 * Formulaire de demande de devis. Sélecteur multi-jours (1–7 consécutifs)
 * avec total calculé en direct via le moteur de prix. Pas de SIRENE/SIRET.
 */
export function QuoteForm({ day, allDays, onBack, onSuccess }: QuoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(1);

  // GA4 : ouverture du formulaire de devis (best-effort).
  useEffect(() => {
    trackEvent("quote_form_open", { date: day.date });
  }, [day.date]);

  // Table de correspondance date → tarif (pour connaître la disponibilité).
  const dayMap = useMemo(() => {
    const map = new Map<string, DayPricing>();
    for (const d of allDays) map.set(d.date, d);
    return map;
  }, [allDays]);

  // Détail des jours consécutifs sélectionnés.
  const consecutiveDays = useMemo(() => {
    const rows: { date: string; price: number; available: boolean }[] = [];
    for (let i = 0; i < numberOfDays; i++) {
      const date = addDaysStr(day.date, i);
      const dp = dayMap.get(date);
      const available = dp ? !dp.isBooked && !dp.isPast : true;
      rows.push({ date, price: getDayPrice(date), available });
    }
    return rows;
  }, [day.date, numberOfDays, dayMap]);

  // Total via le moteur de prix (gère notamment le forfait Fashion Week).
  const totalPrice = useMemo(
    () => getMultiDayTotal(day.date, numberOfDays),
    [day.date, numberOfDays],
  );
  const hasUnavailable = consecutiveDays.some((d) => !d.available);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      date: day.date,
      numberOfDays,
      firstName: (form.get("firstName") as string)?.trim(),
      lastName: (form.get("lastName") as string)?.trim(),
      email: (form.get("email") as string)?.trim(),
      phone: (form.get("phone") as string)?.trim(),
      company: (form.get("company") as string)?.trim() || undefined,
      guests: parseInt(form.get("guests") as string, 10),
      eventType: form.get("eventType") as string,
      message: (form.get("message") as string)?.trim() || undefined,
      totalPrice,
    };

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Erreur lors de l'envoi");
      }
      trackEvent("quote_form_submit", {
        date: day.date,
        number_of_days: numberOfDays,
        value: totalPrice,
      });
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 py-8">
        <div className="text-2xl text-accent">&#10003;</div>
        <p className="font-mono text-sm uppercase tracking-wider text-foreground">
          Demande envoyée
        </p>
        <p className="text-xs text-muted">Nous vous recontactons sous 24h.</p>
      </div>
    );
  }

  const inputClass =
    "border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3 w-3" />
        Retour au tarif
      </button>

      <div className="mb-4 border border-border bg-surface p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {formatDateFR(day.date)}
            {numberOfDays > 1 &&
              ` → ${formatDateFR(addDaysStr(day.date, numberOfDays - 1))}`}
          </p>
          <select
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(parseInt(e.target.value, 10))}
            className="border border-border bg-surface px-2 py-1 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
          >
            {Array.from({ length: MAX_DAYS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} jour{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        {numberOfDays > 1 && (
          <div className="mt-2 flex flex-col gap-1">
            {consecutiveDays.map((cd) => (
              <div
                key={cd.date}
                className="flex items-center justify-between text-xs"
              >
                <span className={cd.available ? "text-muted" : "text-muted line-through"}>
                  {formatDateFR(cd.date)}
                </span>
                <span className="font-mono text-muted">
                  {cd.available ? `${formatPrice(cd.price)} HT` : "Indisponible"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            {numberOfDays > 1 ? "Total" : "Prix"}
          </span>
          <span className="font-mono font-bold text-accent">
            {formatPrice(totalPrice)} HT
          </span>
        </div>

        {hasUnavailable && numberOfDays > 1 && (
          <p className="mt-1 text-[10px] text-accent">
            Certains jours sont indisponibles sur cette période.
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted">
          *prix indicatif pour location seule.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input name="firstName" required placeholder="Prénom *" className={inputClass} />
          <input name="lastName" required placeholder="Nom *" className={inputClass} />
        </div>
        <input
          name="email"
          type="email"
          required
          placeholder="Email *"
          className={inputClass}
        />
        <input
          name="phone"
          type="tel"
          required
          placeholder="Téléphone *"
          className={inputClass}
        />
        <input name="company" placeholder="Entreprise" className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="guests"
            type="number"
            min="1"
            max={MAX_GUESTS}
            required
            placeholder="Nb invités *"
            className={inputClass}
          />
          <select
            name="eventType"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Type d&apos;événement *
            </option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <textarea
          name="message"
          rows={3}
          placeholder="Message (optionnel)"
          className={inputClass}
        />

        {error && <p className="text-xs text-accent">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 border border-accent bg-accent px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Demander un devis
        </button>
      </form>
    </div>
  );
}
