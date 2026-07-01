import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks des effets de bord (KV + email) — on teste uniquement la logique de la route.
vi.mock("@/lib/kv", () => ({ addQuote: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/email", () => ({
  sendQuoteNotification: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { addQuote } from "@/lib/kv";
import { sendQuoteNotification } from "@/lib/email";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  date: "2026-06-03", // mercredi → 1500 €
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean@example.com",
  phone: "0600000000",
  guests: 20,
  eventType: "Cocktail / Soirée",
  numberOfDays: 1,
};

describe("POST /api/quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renvoie 400 si un champ requis manque", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(addQuote).not.toHaveBeenCalled();
    expect(sendQuoteNotification).not.toHaveBeenCalled();
  });

  it("renvoie 400 si l'email est invalide", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "pas-un-email" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(addQuote).not.toHaveBeenCalled();
  });

  it("crée le devis et notifie l'équipe si la requête est valide", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.id).toBeTruthy();
    expect(addQuote).toHaveBeenCalledOnce();
    expect(sendQuoteNotification).toHaveBeenCalledOnce();
  });

  it("recalcule le total côté serveur (ignore le prix fourni par le client)", async () => {
    // 3 jours dès le mercredi : 1500 + 2000 + 1500 = 5000 €
    await POST(makeRequest({ ...validBody, numberOfDays: 3, totalPrice: 999 }));
    const quoteArg = vi.mocked(addQuote).mock.calls[0][0];
    expect(quoteArg.totalPrice).toBe(5000);
    expect(quoteArg.numberOfDays).toBe(3);
  });
});
