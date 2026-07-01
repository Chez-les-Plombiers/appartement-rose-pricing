import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CalendarHeatmap, type WindowMonth } from "@/components/CalendarHeatmap";
import { computeDayPricing } from "@/lib/pricing-engine";
import { getBookedDays } from "@/lib/google-calendar";
import { getPriceConfig } from "@/lib/kv";
import { getDatesInMonth } from "@/lib/date-utils";
import type { DayPricing } from "@/types";

// Rendu dynamique : la disponibilité (Google Calendar) est relue à chaque requête.
export const dynamic = "force-dynamic";

const WINDOW_MONTHS = 12;

export default async function Home() {
  const now = new Date();

  // Fenêtre glissante de 12 mois à partir du mois courant.
  const months: WindowMonth[] = Array.from({ length: WINDOW_MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const first = months[0];
  const last = months[months.length - 1];
  const timeMin = new Date(first.year, first.month, 1).toISOString();
  const timeMax = new Date(last.year, last.month + 1, 0, 23, 59, 59).toISOString();

  // Jours réservés (ensemble vide si l'API n'est pas configurée / échoue) et
  // surcharges de prix administrateur (config vide si KV indisponible).
  const [bookedDays, priceConfig] = await Promise.all([
    getBookedDays(timeMin, timeMax),
    getPriceConfig(),
  ]);

  // Tarifs pré-calculés, drapeau réservé fusionné, surcharges admin appliquées.
  const days: DayPricing[] = months.flatMap(({ year, month }) =>
    getDatesInMonth(year, month).map((date) =>
      computeDayPricing(date, { isBooked: bookedDays.has(date) }, priceConfig),
    ),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 border border-accent/40 bg-accent/10 px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Prix indicatifs HT — nous confirmer la disponibilité
          </p>
        </div>
        <CalendarHeatmap days={days} months={months} />
      </main>
      <Footer />
    </div>
  );
}
