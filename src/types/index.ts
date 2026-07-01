/**
 * Types Appartement Rose — calendrier de prix simplifié.
 * Journée complète uniquement : pas de créneaux (matin / après-midi),
 * pas de coefficient de remise, pas de paliers de demande.
 */

/** Prix calculé pour un jour donné (journée complète, HT). */
export interface DayPricing {
  date: string; // YYYY-MM-DD
  price: number; // prix journée complète, HT, en euros
  isBooked: boolean; // le jour est-il déjà réservé
  isPast: boolean; // le jour est-il antérieur à aujourd'hui
}

/** Date spéciale surchargeant le prix du jour de semaine (fériés, ponts, saison…). */
export interface SpecialDate {
  date: string; // YYYY-MM-DD
  price: number; // prix journée complète, HT, en euros
  label: string; // libellé affiché (ex. "Jour férié", "Haute saison")
}

/** Demande de devis envoyée depuis le formulaire. */
export interface QuoteRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  guests: number;
  eventType: string;
  message?: string;
  date: string; // YYYY-MM-DD (jour de début)
  numberOfDays: number;
  totalPrice: number; // total HT en euros
  createdAt: string; // ISO
}
