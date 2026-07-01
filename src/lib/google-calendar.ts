/**
 * Disponibilité Appartement Rose — source de vérité Google Calendar.
 *
 * Simplification volontaire : journée entière uniquement. Tout événement
 * présent un jour donné marque ce jour comme réservé.
 *
 * Robustesse : si les variables d'environnement manquent OU si l'appel échoue,
 * on renvoie un ensemble vide (tout est disponible). On ne lève jamais
 * d'exception — le rendu serveur (SSR) ne doit jamais planter, et
 * l'environnement de build n'a pas ces variables.
 */

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID?.trim();
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY?.trim();

export interface GCalEvent {
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

/** Extrait la partie date locale (YYYY-MM-DD) d'un "2026-03-25T07:00:00+01:00". */
function localDatePart(dateTime: string): string {
  const match = dateTime.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : dateTime.split("T")[0];
}

/** Ajoute n jours à une date YYYY-MM-DD (calcul UTC, sûr vis-à-vis des fuseaux). */
function addDaysStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().split("T")[0];
}

/**
 * Convertit un événement Google Calendar en liste de jours réservés (YYYY-MM-DD).
 * - Événement all-day : chaque jour de [start.date, end.date) (fin exclusive).
 * - Événement horaire : chaque jour de la date de début à la date de fin (incluses).
 */
export function eventToBookedDays(event: GCalEvent): string[] {
  // Événement all-day (start.date renseigné, fin exclusive).
  if (event.start.date) {
    const end = event.end.date ?? addDaysStr(event.start.date, 1);
    const days: string[] = [];
    let current = event.start.date;
    while (current < end) {
      days.push(current);
      current = addDaysStr(current, 1);
    }
    return days;
  }

  // Événement horaire (start.dateTime / end.dateTime).
  if (event.start.dateTime && event.end.dateTime) {
    const startDay = localDatePart(event.start.dateTime);
    const endDay = localDatePart(event.end.dateTime);
    const days: string[] = [];
    let current = startDay;
    while (current <= endDay) {
      days.push(current);
      current = addDaysStr(current, 1);
    }
    return days;
  }

  return [];
}

/**
 * Renvoie l'ensemble des jours réservés (YYYY-MM-DD) sur la plage [timeMin, timeMax].
 * `timeMin` / `timeMax` sont des timestamps RFC3339 (ex. via `Date.toISOString()`).
 */
export async function getBookedDays(
  timeMin: string,
  timeMax: string,
): Promise<Set<string>> {
  if (!CALENDAR_ID || !API_KEY) return new Set();

  const params = new URLSearchParams({
    key: API_KEY,
    timeMin,
    timeMax,
    timeZone: "Europe/Paris",
    singleEvents: "true",
    maxResults: "2500",
    fields: "items(start,end)",
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return new Set();

    const data = (await res.json()) as { items?: GCalEvent[] };
    const booked = new Set<string>();
    for (const event of data.items ?? []) {
      for (const day of eventToBookedDays(event)) booked.add(day);
    }
    return booked;
  } catch {
    return new Set();
  }
}
