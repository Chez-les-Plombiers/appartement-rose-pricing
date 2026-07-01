"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Sparkles } from "lucide-react";
import type { DayPricing } from "@/types";
import { formatDateFR, formatDayOfWeekFR, formatPrice } from "@/lib/date-utils";
import { isFashionWeek } from "@/lib/calendar-data";
import { QuoteForm } from "./QuoteForm";

interface DayModalProps {
  day: DayPricing;
  allDays: DayPricing[];
  onClose: () => void;
}

/**
 * Détail d'un jour : jour de semaine + date, prix journée entière et CTA devis.
 * Affiche "Réservé" (sans prix ni CTA) si le jour est déjà pris.
 * Signale les jours de Fashion Week.
 */
export function DayModal({ day, allDays, onClose }: DayModalProps) {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const fashionWeek = isFashionWeek(day.date);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border border-border bg-card p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="font-mono text-lg font-bold uppercase tracking-wider text-foreground">
                {formatDayOfWeekFR(day.date)} {formatDateFR(day.date)}
              </Dialog.Title>
              {fashionWeek && (
                <div className="mt-2 inline-flex items-center gap-1.5 border border-accent/50 px-2 py-0.5">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                    Fashion Week
                  </span>
                </div>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-muted transition-colors hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {day.isBooked ? (
            <div className="mt-6 border border-border bg-surface p-4 text-center">
              <p className="font-mono text-sm uppercase tracking-wider text-muted">
                Réservé
              </p>
              <p className="mt-1 text-xs text-muted">
                Ce jour n&apos;est plus disponible.
              </p>
            </div>
          ) : !showQuoteForm ? (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border border-border bg-surface p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground">Journée entière</span>
                  <span className="text-[10px] text-muted">
                    Prix HT — Location seule
                  </span>
                </div>
                <span className="font-mono text-xl font-bold text-accent">
                  {formatPrice(day.price)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuoteForm(true)}
                className="border border-accent bg-accent px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-background transition-colors hover:bg-accent-hover"
              >
                Demander un devis
              </button>
            </div>
          ) : (
            <QuoteForm
              day={day}
              allDays={allDays}
              onBack={() => setShowQuoteForm(false)}
              onSuccess={onClose}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
