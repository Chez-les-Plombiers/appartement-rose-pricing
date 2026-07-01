import { describe, it, expect } from "vitest";
import { eventToBookedDays, type GCalEvent } from "./google-calendar";

describe("eventToBookedDays", () => {
  it("mappe un événement all-day mono-jour (fin exclusive)", () => {
    const event: GCalEvent = {
      start: { date: "2026-06-03" },
      end: { date: "2026-06-04" },
    };
    expect(eventToBookedDays(event)).toEqual(["2026-06-03"]);
  });

  it("mappe un événement all-day multi-jours (fin exclusive)", () => {
    const event: GCalEvent = {
      start: { date: "2026-06-03" },
      end: { date: "2026-06-06" },
    };
    expect(eventToBookedDays(event)).toEqual([
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("mappe un événement horaire dans la journée (un seul jour)", () => {
    const event: GCalEvent = {
      start: { dateTime: "2026-06-03T09:00:00+02:00" },
      end: { dateTime: "2026-06-03T18:00:00+02:00" },
    };
    expect(eventToBookedDays(event)).toEqual(["2026-06-03"]);
  });

  it("mappe un événement horaire à cheval sur plusieurs jours (bornes incluses)", () => {
    const event: GCalEvent = {
      start: { dateTime: "2026-06-03T20:00:00+02:00" },
      end: { dateTime: "2026-06-05T02:00:00+02:00" },
    };
    expect(eventToBookedDays(event)).toEqual([
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("renvoie une liste vide pour un événement mal formé", () => {
    expect(eventToBookedDays({ start: {}, end: {} })).toEqual([]);
  });
});
