"use client";

import { useRef, useCallback, useState, useMemo } from "react";
import type { DayPricing } from "@/types";
import { trackDayClick } from "@/lib/analytics";
import { MonthGrid } from "./MonthGrid";
import { MonthNavigator } from "./MonthNavigator";
import { DayModal } from "./DayModal";

export interface WindowMonth {
  year: number;
  month: number; // 0-11
}

interface CalendarHeatmapProps {
  /** Tarifs pré-calculés (drapeau réservé déjà fusionné côté serveur). */
  days: DayPricing[];
  /** Fenêtre glissante de 12 mois à afficher. */
  months: WindowMonth[];
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * Calendrier annuel : 12 grilles mensuelles (responsive 1/2/3/4 colonnes) +
 * navigation mobile. Détient l'état de la modale du jour sélectionné.
 */
export function CalendarHeatmap({ days, months }: CalendarHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<DayPricing | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleMonthClick = useCallback((key: string) => {
    setActiveKey(key);
    monthRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleDayClick = useCallback((day: DayPricing) => {
    setSelectedDay(day);
    trackDayClick(day.date); // best-effort : GA4 + vue serveur
  }, []);

  // Regroupe les jours par mois (clé YYYY-MM) une seule fois.
  const byMonth = useMemo(() => {
    const map: Record<string, DayPricing[]> = {};
    for (const day of days) {
      const key = day.date.slice(0, 7);
      (map[key] ??= []).push(day);
    }
    return map;
  }, [days]);

  return (
    <div className="flex flex-col gap-6">
      <MonthNavigator
        months={months}
        activeKey={activeKey}
        onMonthClick={handleMonthClick}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map(({ year, month }) => {
          const key = monthKey(year, month);
          return (
            <div
              key={key}
              ref={(el) => {
                monthRefs.current[key] = el;
              }}
            >
              <MonthGrid
                month={month}
                year={year}
                days={byMonth[key] ?? []}
                onDayClick={handleDayClick}
              />
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <DayModal
          day={selectedDay}
          allDays={days}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
