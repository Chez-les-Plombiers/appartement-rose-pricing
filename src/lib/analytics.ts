/**
 * Analytics légères, best-effort, côté client.
 *
 * - `trackEvent` pousse un événement vers GA4 (`window.gtag`) s'il est présent ;
 * - `trackDayClick` enregistre en plus une vue de jour côté serveur
 *   (POST /api/analytics → incrementDayView).
 *
 * Toutes les fonctions sont sûres si GA4 / le réseau sont absents : elles ne
 * lèvent jamais et n'ont aucun effet visible en cas d'échec.
 */

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      targetOrName: string,
      params?: GtagParams,
    ) => void;
  }
}

/** Envoie un événement GA4 si `window.gtag` est disponible. */
export function trackEvent(name: string, params?: GtagParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {
    // best-effort : on ignore toute erreur analytics.
  }
}

/**
 * Enregistre un clic sur une cellule de jour : événement GA4 `calendar_day_click`
 * + incrément de la vue côté serveur. Ne bloque jamais l'UI.
 */
export function trackDayClick(dateStr: string): void {
  trackEvent("calendar_day_click", { date: dateStr });
  if (typeof fetch === "undefined") return;
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: dateStr }),
    keepalive: true,
  }).catch(() => {
    // best-effort : on ignore les erreurs réseau.
  });
}
