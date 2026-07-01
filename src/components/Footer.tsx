import { MapPin } from "lucide-react";

/** Pied de page : adresse / superficie (À FOURNIR) + mention tarifaire. */
export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted">
              <MapPin className="h-4 w-4 text-accent" />
              39 rue des Bourdonnais, 75001 Paris
            </div>
            <p className="text-xs text-muted">
              L&apos;Appartement Rose — 100 m², jusqu&apos;à 50 personnes
            </p>
          </div>
          <p className="text-xs text-muted">Prix HT — Location seule</p>
        </div>
      </div>
    </footer>
  );
}
