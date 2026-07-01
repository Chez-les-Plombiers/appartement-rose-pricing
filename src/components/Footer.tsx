import { MapPin } from "lucide-react";

/** Pied de page : adresse / superficie (À FOURNIR) + mention tarifaire. */
export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            {/* TODO À FOURNIR : adresse exacte de l'Appartement Rose */}
            <div className="flex items-center gap-2 text-sm text-muted">
              <MapPin className="h-4 w-4 text-accent" />
              Adresse à fournir — Paris
            </div>
            {/* TODO À FOURNIR : superficie du lieu */}
            <p className="text-xs text-muted">
              Superficie à fournir — Lieu événementiel
            </p>
          </div>
          <p className="text-xs text-muted">Prix HT — Location seule</p>
        </div>
      </div>
    </footer>
  );
}
