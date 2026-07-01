"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Phone, Users, CalendarDays } from "lucide-react";
import type { QuoteRequest } from "@/types";
import { formatDateFR, formatPrice, addDaysStr } from "@/lib/date-utils";

interface AdminLeadsListProps {
  token: string;
}

/** Formate un ISO en date + heure FR courtes (ex. "3 juin 2026, 14:07"). */
function formatReceivedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** Liste des demandes de devis reçues (les plus récentes en tête). */
export function AdminLeadsList({ token }: AdminLeadsListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/quotes", {
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error("Chargement impossible");
        const data = (await res.json()) as { quotes: QuoteRequest[] };
        if (active) setQuotes(data.quotes ?? []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-mono text-xs uppercase tracking-wider">Chargement…</span>
      </div>
    );
  }

  if (error) {
    return <p className="py-4 text-xs text-accent">{error}</p>;
  }

  return (
    <section>
      <h2 className="mb-1 font-mono text-sm font-bold uppercase tracking-widest text-foreground">
        Demandes de devis
      </h2>
      <p className="mb-4 text-xs text-muted">
        {quotes.length} demande{quotes.length > 1 ? "s" : ""} reçue
        {quotes.length > 1 ? "s" : ""}.
      </p>

      {quotes.length === 0 ? (
        <p className="text-xs text-muted">Aucune demande pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {quotes.map((q) => {
            const endDate =
              q.numberOfDays > 1 ? addDaysStr(q.date, q.numberOfDays - 1) : null;
            return (
              <li
                key={q.id}
                className="flex flex-col gap-3 border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                      {q.firstName} {q.lastName}
                    </p>
                    {q.company && (
                      <p className="text-xs text-muted">{q.company}</p>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {formatReceivedAt(q.createdAt)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                  <a
                    href={`mailto:${q.email}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-accent"
                  >
                    <Mail className="h-3 w-3" />
                    {q.email}
                  </a>
                  <a
                    href={`tel:${q.phone}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-accent"
                  >
                    <Phone className="h-3 w-3" />
                    {q.phone}
                  </a>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    {q.guests} invité{q.guests > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-3 text-xs">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <CalendarDays className="h-3 w-3 text-accent" />
                    {formatDateFR(q.date)}
                    {endDate && ` → ${formatDateFR(endDate)}`}
                    <span className="text-muted">
                      ({q.numberOfDays} jour{q.numberOfDays > 1 ? "s" : ""})
                    </span>
                  </span>
                  <span className="text-muted">{q.eventType}</span>
                  <span className="ml-auto font-mono font-bold text-accent">
                    {formatPrice(q.totalPrice)} HT
                  </span>
                </div>

                {q.message && (
                  <p className="border-t border-border pt-3 text-xs text-muted">
                    {q.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
