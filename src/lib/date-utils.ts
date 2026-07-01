/**
 * Utilitaires de date et de formatage (FR) pour le calendrier Appartement Rose.
 * Porté depuis Chez Les Plombiers, sans dépendance externe.
 */

const FR_MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const FR_MONTHS_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
];

const FR_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const FR_DAYS_LETTER = ["L", "M", "M", "J", "V", "S", "D"];

/** Formate une date YYYY-MM-DD en "3 Juin 2026". */
export function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = FR_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day === 1 ? "1er" : day} ${month} ${year}`;
}

/** Renvoie le jour de la semaine en toutes lettres (ex. "Mercredi"). */
export function formatDayOfWeekFR(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay();
  return FR_DAYS[dow === 0 ? 6 : dow - 1];
}

/** Nom complet du mois (0 = janvier). */
export function getMonthNameFR(month: number): string {
  return FR_MONTHS[month];
}

/** Nom court du mois (0 = janvier). */
export function getMonthNameShortFR(month: number): string {
  return FR_MONTHS_SHORT[month];
}

/** Lettres des jours, ordre lundi → dimanche. */
export function getDayLetters(): readonly string[] {
  return FR_DAYS_LETTER;
}

/** Jour ISO de la semaine : 1 = lundi … 7 = dimanche. */
export function getISODayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay();
  return dow === 0 ? 7 : dow;
}

/** Formate un prix en euros (ex. "1 500 €"). */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/** Formate un prix de façon compacte pour les cellules (ex. "1,5k€", "3k€"). */
export function formatPriceCompact(price: number): string {
  if (price >= 1000) {
    const k = price / 1000;
    return `${k.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}k€`;
  }
  return `${price}€`;
}

/** Toutes les dates d'un mois au format YYYY-MM-DD. */
export function getDatesInMonth(year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    dates.push(`${year}-${m}-${d}`);
  }
  return dates;
}

/** Numéro de jour du mois depuis une chaîne YYYY-MM-DD. */
export function getDayOfMonth(dateStr: string): number {
  return parseInt(dateStr.split("-")[2], 10);
}

/** Ajoute n jours à une date YYYY-MM-DD (calcul UTC, sûr vis-à-vis des fuseaux). */
export function addDaysStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().split("T")[0];
}
