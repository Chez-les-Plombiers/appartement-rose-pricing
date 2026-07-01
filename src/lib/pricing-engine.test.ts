import { describe, it, expect } from "vitest";
import { getDayPrice, getMultiDayTotal, computeDayPricing } from "./pricing-engine";

/*
 * Dates de référence (vérifiées, hors Fashion Week) :
 *   2026-06-01 = Lundi    → 1000
 *   2026-06-03 = Mercredi → 1500
 *   2026-06-04 = Jeudi    → 2000
 *   2026-06-05 = Vendredi → 1500
 *
 * Fashion Week 2026 (extraits) :
 *   Homme        : 2026-06-23 → 2026-06-28
 *   Femme PAP    : 2026-09-28 → 2026-10-06 (9 jours)
 */

describe("getDayPrice", () => {
  it("renvoie le prix du jour de semaine (mercredi → 1500)", () => {
    expect(getDayPrice("2026-06-03")).toBe(1500);
  });

  it("renvoie le prix du jour de semaine (lundi → 1000)", () => {
    expect(getDayPrice("2026-06-01")).toBe(1000);
  });

  it("renvoie le prix du jour de semaine (jeudi → 2000)", () => {
    expect(getDayPrice("2026-06-04")).toBe(2000);
  });

  it("renvoie le prix du jour de semaine (vendredi → 1500)", () => {
    expect(getDayPrice("2026-06-05")).toBe(1500);
  });

  it("renvoie le prix du week-end (samedi/dimanche → 1000)", () => {
    expect(getDayPrice("2026-06-06")).toBe(1000); // samedi
    expect(getDayPrice("2026-06-07")).toBe(1000); // dimanche
  });

  it("applique le tarif Fashion Week (3000/jour) au-dessus du jour de semaine", () => {
    // 2026-06-24 = mercredi (1500 hors FW) mais tombe en Fashion Week Homme
    expect(getDayPrice("2026-06-24")).toBe(3000);
  });

  it("un override de date surcharge le prix du jour de semaine", () => {
    const config = { dateOverrides: { "2026-06-03": 5000 } };
    expect(getDayPrice("2026-06-03", config)).toBe(5000);
    expect(getDayPrice("2026-06-03")).toBe(1500);
  });

  it("un override de date surcharge même la Fashion Week", () => {
    const config = { dateOverrides: { "2026-06-24": 999 } };
    expect(getDayPrice("2026-06-24", config)).toBe(999);
  });

  it("un override de jour de semaine surcharge la grille par défaut (mercredi)", () => {
    const config = { weekdayOverrides: { 3: 2500 } }; // 3 = mercredi
    expect(getDayPrice("2026-06-03", config)).toBe(2500);
    expect(getDayPrice("2026-06-03")).toBe(1500);
  });

  it("un override de jour de semaine n'affecte pas les autres jours", () => {
    const config = { weekdayOverrides: { 3: 2500 } }; // mercredi seulement
    expect(getDayPrice("2026-06-04", config)).toBe(2000); // jeudi inchangé
  });

  it("la Fashion Week bat un override de jour de semaine", () => {
    // 2026-06-24 = mercredi en Fashion Week Homme (3000)
    const config = { weekdayOverrides: { 3: 2500 } };
    expect(getDayPrice("2026-06-24", config)).toBe(3000);
  });

  it("un override de date bat un override de jour de semaine", () => {
    const config = {
      dateOverrides: { "2026-06-03": 5000 },
      weekdayOverrides: { 3: 2500 },
    };
    expect(getDayPrice("2026-06-03", config)).toBe(5000);
  });

  it("ne dépend pas de la distance à aujourd'hui (même date = même prix)", () => {
    const first = getDayPrice("2026-06-05");
    const second = getDayPrice("2026-06-05");
    expect(first).toBe(second);
    expect(first).toBe(1500);
  });
});

describe("getMultiDayTotal", () => {
  it("somme les prix de jours consécutifs (3 jours dès le mercredi)", () => {
    // Mer 1500 + Jeu 2000 + Ven 1500 = 5000
    expect(getMultiDayTotal("2026-06-03", 3)).toBe(5000);
  });

  it("un seul jour équivaut à getDayPrice", () => {
    expect(getMultiDayTotal("2026-06-01", 1)).toBe(getDayPrice("2026-06-01"));
  });

  it("prend en compte les overrides de date dans la somme", () => {
    const config = { dateOverrides: { "2026-06-04": 10000 } };
    // Mer 1500 + Jeu (override) 10000 + Ven 1500 = 13000
    expect(getMultiDayTotal("2026-06-03", 3, config)).toBe(13000);
  });

  it("prend en compte les overrides de jour de semaine dans la somme", () => {
    const config = { weekdayOverrides: { 4: 3000 } }; // jeudi 2000 → 3000
    // Mer 1500 + Jeu (override) 3000 + Ven 1500 = 6000
    expect(getMultiDayTotal("2026-06-03", 3, config)).toBe(6000);
  });

  it("applique le forfait semaine Fashion Week (15 000) pour 7 jours consécutifs en FW", () => {
    // 2026-09-28 → 2026-10-04 = 7 jours, tous en Fashion Week Femme PAP
    expect(getMultiDayTotal("2026-09-28", 7)).toBe(15000);
  });

  it("sans le forfait (6 jours FW) : 6 × 3000 = 18 000", () => {
    expect(getMultiDayTotal("2026-09-28", 6)).toBe(18000);
  });

  it("le forfait semaine FW ne s'applique pas si un jour a un prix explicite", () => {
    const config = { dateOverrides: { "2026-09-28": 4000 } };
    // 4000 (override) + 6 × 3000 (FW) = 22 000
    expect(getMultiDayTotal("2026-09-28", 7, config)).toBe(22000);
  });

  it("le forfait semaine FW s'applique malgré un override de jour de semaine (FW prioritaire)", () => {
    // Un override de jour de semaine ne constitue pas un prix explicite : le
    // forfait Fashion Week reste applicable sur 7 jours consécutifs en FW.
    const config = { weekdayOverrides: { 1: 500, 2: 500, 3: 500 } };
    expect(getMultiDayTotal("2026-09-28", 7, config)).toBe(15000);
  });
});

describe("computeDayPricing", () => {
  it("construit un DayPricing journée complète avec le drapeau réservé", () => {
    const result = computeDayPricing("2026-06-03", { isBooked: true });
    expect(result.date).toBe("2026-06-03");
    expect(result.price).toBe(1500);
    expect(result.isBooked).toBe(true);
  });

  it("isPast est vrai pour une date passée", () => {
    expect(computeDayPricing("2000-01-01").isPast).toBe(true);
  });

  it("isPast est faux pour une date lointaine dans le futur", () => {
    expect(computeDayPricing("2099-12-31").isPast).toBe(false);
  });
});
