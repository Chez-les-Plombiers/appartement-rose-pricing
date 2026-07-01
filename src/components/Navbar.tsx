import { ArrowLeft } from "lucide-react";

/** En-tête : retour au site principal + titre du calendrier. */
export function Navbar() {
  return (
    <nav className="border-b border-border px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <a
          href="https://www.chezlesplombiers.fr"
          className="flex items-center gap-2 text-muted transition-colors hover:text-foreground"
          title="Retour au site"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
            Appartement Rose
          </span>
        </a>
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          Tarifs
        </span>
      </div>
    </nav>
  );
}
