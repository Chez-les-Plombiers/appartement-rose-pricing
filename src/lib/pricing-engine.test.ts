import { describe, it, expect } from "vitest";
import { getDayPrice, getMultiDayTotal, computeDayPricing } from "./pricing-engine";

/*
 * Dates de référence (vérifiées) :
 *   2026-06-01 = Lundi    → 1500
 *   2026-06-03 = Mercredi → 2000
 *   2026-06-04 = Jeudi    → 3000
 *   2026-06-05 = Vendredi → 2500
 */

describe("getDayPrice", () => {
  it("renvoie le prix du jour de semaine (mercredi → 2000)", () => {
    expect(getDayPrice("2026-06-03")).toBe(2000);
  });

  it("renvoie le prix du jour de semaine (lundi → 1500)", () => {
    expect(getDayPrice("2026-06-01")).toBe(1500);
  });

  it("renvoie le prix du jour de semaine (jeudi → 3000)", () => {
    expect(getDayPrice("2026-06-04")).toBe(3000);
  });

  it("renvoie le prix du jour de semaine (vendredi → 2500)", () => {
    expect(getDayPrice("2026-06-05")).toBe(2500);
  });

  it("une date spéciale surcharge le prix du jour de semaine", () => {
    // 2026-06-03 est un mercredi (2000 par défaut) ; l'override le remplace
    const overrides = { "2026-06-03": 5000 };
    expect(getDayPrice("2026-06-03", overrides)).toBe(5000);
    // sans override, on retombe sur le prix du jour de semaine
    expect(getDayPrice("2026-06-03")).toBe(2000);
  });

  it("ne dépend pas de la distance à aujourd'hui (même date = même prix)", () => {
    const first = getDayPrice("2026-06-05");
    const second = getDayPrice("2026-06-05");
    expect(first).toBe(second);
    expect(first).toBe(2500);
  });
});

describe("getMultiDayTotal", () => {
  it("somme les prix de jours consécutifs (3 jours dès le mercredi)", () => {
    // Mer 2000 + Jeu 3000 + Ven 2500 = 7500
    expect(getMultiDayTotal("2026-06-03", 3)).toBe(7500);
  });

  it("un seul jour équivaut à getDayPrice", () => {
    expect(getMultiDayTotal("2026-06-01", 1)).toBe(getDayPrice("2026-06-01"));
  });

  it("prend en compte les dates spéciales dans la somme", () => {
    const overrides = { "2026-06-04": 10000 };
    // Mer 2000 + Jeu (override) 10000 + Ven 2500 = 14500
    expect(getMultiDayTotal("2026-06-03", 3, overrides)).toBe(14500);
  });
});

describe("computeDayPricing", () => {
  it("construit un DayPricing journée complète avec le drapeau réservé", () => {
    const result = computeDayPricing("2026-06-03", { isBooked: true });
    expect(result.date).toBe("2026-06-03");
    expect(result.price).toBe(2000);
    expect(result.isBooked).toBe(true);
  });

  it("isPast est vrai pour une date passée", () => {
    expect(computeDayPricing("2000-01-01").isPast).toBe(true);
  });

  it("isPast est faux pour une date lointaine dans le futur", () => {
    expect(computeDayPricing("2099-12-31").isPast).toBe(false);
  });
});
