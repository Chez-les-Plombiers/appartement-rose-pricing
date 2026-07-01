"use client";

import type { DayPricing } from "@/types";
import { getDayOfMonth, formatPrice, formatPriceCompact } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface DayCellProps {
  day: DayPricing;
  onClick: (day: DayPricing) => void;
}

/**
 * Cellule d'un jour (journée entière, pas de split matin/après-midi).
 * Grisée et non cliquable si le jour est passé ou réservé ; sinon cliquable.
 */
export function DayCell({ day, onClick }: DayCellProps) {
  const dayNum = getDayOfMonth(day.date);
  const isDisabled = day.isBooked || day.isPast;

  const ariaLabel = day.isBooked
    ? `${dayNum} — réservé`
    : day.isPast
      ? `${dayNum} — passé`
      : `${dayNum} — ${formatPrice(day.price)} HT`;

  return (
    <button
      type="button"
      onClick={() => onClick(day)}
      disabled={isDisabled}
      aria-label={ariaLabel}
      className={cn(
        "group flex h-12 w-full flex-col items-center justify-center gap-0.5 border transition-colors sm:h-14",
        isDisabled
          ? "cursor-not-allowed border-transparent bg-booked/50 text-muted"
          : "cursor-pointer border-border bg-surface text-foreground hover:border-accent hover:bg-card",
      )}
    >
      <span className="text-xs font-medium sm:text-sm">{dayNum}</span>
      {isDisabled ? (
        day.isBooked && (
          <span className="font-mono text-[8px] uppercase tracking-wider text-muted sm:text-[9px]">
            Réservé
          </span>
        )
      ) : (
        <span className="font-mono text-[9px] text-accent transition-colors group-hover:text-accent-hover sm:text-[10px]">
          {formatPriceCompact(day.price)}
        </span>
      )}
    </button>
  );
}
