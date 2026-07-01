"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Save, Sparkles } from "lucide-react";
import { WEEKDAY_PRICES } from "@/lib/tier-config";
import { formatDateFR, formatPrice } from "@/lib/date-utils";
import type { StoredPriceConfig } from "@/lib/kv";

interface AdminPriceEditorProps {
  token: string;
}

/** Jours affichés dans l'ordre Lundi → Dimanche (index = valeur getDay()). */
const WEEKDAY_ORDER: { dow: number; label: string }[] = [
  { dow: 1, label: "Lundi" },
  { dow: 2, label: "Mardi" },
  { dow: 3, label: "Mercredi" },
  { dow: 4, label: "Jeudi" },
  { dow: 5, label: "Vendredi" },
  { dow: 6, label: "Samedi" },
  { dow: 0, label: "Dimanche" },
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Éditeur de prix administrateur :
 * - grille par jour de semaine (valeur par défaut WEEKDAY_PRICES, surchargeable) ;
 * - surcharges par date précise (ajout / suppression).
 * Enregistre l'ensemble via POST /api/admin/prices.
 */
export function AdminPriceEditor({ token }: AdminPriceEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Champs saisis : chaînes (vide = « utiliser la valeur par défaut »).
  const [weekdayInputs, setWeekdayInputs] = useState<Record<number, string>>({});
  const [dateOverrides, setDateOverrides] = useState<Record<string, number>>({});

  // Ajout d'une nouvelle surcharge de date.
  const [newDate, setNewDate] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/prices", {
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error("Chargement impossible");
        const config = (await res.json()) as StoredPriceConfig;
        if (!active) return;
        const inputs: Record<number, string> = {};
        for (const [dow, price] of Object.entries(config.weekdayOverrides)) {
          inputs[Number(dow)] = String(price);
        }
        setWeekdayInputs(inputs);
        setDateOverrides(config.dateOverrides ?? {});
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  const sortedDateOverrides = useMemo(
    () => Object.entries(dateOverrides).sort(([a], [b]) => a.localeCompare(b)),
    [dateOverrides],
  );

  function handleWeekdayChange(dow: number, value: string) {
    setSaved(false);
    setWeekdayInputs((prev) => ({ ...prev, [dow]: value }));
  }

  function handleAddDate() {
    setError(null);
    if (!DATE_REGEX.test(newDate)) {
      setError("Date invalide (format AAAA-MM-JJ)");
      return;
    }
    const price = Number(newPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Prix invalide");
      return;
    }
    setSaved(false);
    setDateOverrides((prev) => ({ ...prev, [newDate]: price }));
    setNewDate("");
    setNewPrice("");
  }

  function handleRemoveDate(date: string) {
    setSaved(false);
    setDateOverrides((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    // Convertit les champs jour de semaine : vide/0 → pas de surcharge.
    const weekdayOverrides: Record<number, number> = {};
    for (const { dow } of WEEKDAY_ORDER) {
      const raw = weekdayInputs[dow];
      if (raw === undefined || raw.trim() === "") continue;
      const price = Number(raw);
      if (!Number.isFinite(price) || price <= 0) {
        setError(`Prix invalide pour un jour de semaine`);
        setSaving(false);
        return;
      }
      weekdayOverrides[dow] = price;
    }

    try {
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ weekdayOverrides, dateOverrides }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Enregistrement impossible");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-mono text-xs uppercase tracking-wider">Chargement…</span>
      </div>
    );
  }

  const inputClass =
    "border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

  return (
    <section className="flex flex-col gap-8">
      {/* Grille jour de semaine */}
      <div>
        <h2 className="mb-1 font-mono text-sm font-bold uppercase tracking-widest text-foreground">
          Grille par jour de semaine
        </h2>
        <p className="mb-4 text-xs text-muted">
          Laissez vide pour utiliser le tarif par défaut. La valeur saisie
          surcharge la grille pour tous les jours de la semaine concernés.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {WEEKDAY_ORDER.map(({ dow, label }) => (
            <label
              key={dow}
              className="flex flex-col gap-1 border border-border bg-card p-3"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {label}
              </span>
              <input
                type="number"
                min="0"
                value={weekdayInputs[dow] ?? ""}
                onChange={(e) => handleWeekdayChange(dow, e.target.value)}
                placeholder={`${WEEKDAY_PRICES[dow]} (défaut)`}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Note Fashion Week */}
      <div className="flex items-start gap-2 border border-accent/40 bg-accent/10 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p className="text-xs text-muted">
          Les tarifs Fashion Week (3 000 €/jour, 15 000 € le forfait 7 jours) sont
          appliqués automatiquement et ne se règlent pas ici. Un tarif par date
          ci-dessous reste prioritaire même pendant la Fashion Week.
        </p>
      </div>

      {/* Surcharges par date */}
      <div>
        <h2 className="mb-1 font-mono text-sm font-bold uppercase tracking-widest text-foreground">
          Tarifs par date
        </h2>
        <p className="mb-4 text-xs text-muted">
          Prix exceptionnel pour une date précise (fériés, ponts, événements…).
          Priorité maximale.
        </p>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Date
            </span>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Prix HT (€)
            </span>
            <input
              type="number"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="ex. 5000"
              className={inputClass}
            />
          </label>
          <button
            type="button"
            onClick={handleAddDate}
            className="flex items-center justify-center gap-1 border border-border px-3 py-2 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="h-3 w-3" />
            Ajouter
          </button>
        </div>

        {sortedDateOverrides.length === 0 ? (
          <p className="text-xs text-muted">Aucun tarif par date.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedDateOverrides.map(([date, price]) => (
              <li
                key={date}
                className="flex items-center justify-between border border-border bg-card px-3 py-2"
              >
                <span className="text-sm text-foreground">{formatDateFR(date)}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-accent">
                    {formatPrice(price)} HT
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(date)}
                    className="text-muted transition-colors hover:text-accent"
                    aria-label={`Supprimer le tarif du ${formatDateFR(date)}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 border border-accent bg-accent px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Enregistrer
        </button>
        {saved && (
          <span className="font-mono text-xs uppercase tracking-wider text-accent">
            Enregistré ✓
          </span>
        )}
        {error && <span className="text-xs text-accent">{error}</span>}
      </div>
    </section>
  );
}
