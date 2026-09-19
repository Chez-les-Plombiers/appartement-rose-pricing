import type { NextConfig } from "next";

// CSP : self + GA4 + Microsoft Clarity (chargés seulement si les IDs publics
// sont configurés, mais les origines sont autorisées d'avance).
// 'unsafe-inline' scripts : requis par les snippets GA/Clarity et Next sans infra nonce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.googletagmanager.com https://*.clarity.ms",
  "font-src 'self'",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  /**
   * ⚠️ CETTE APPLICATION EST RETIRÉE DU SERVICE (19/09/2026).
   *
   * Elle fait doublon avec `chez-les-plombiers-pricing`, devenu multi-lieux :
   * la grille par jour de semaine et le tarif Fashion Week y sont identiques
   * au centime près. Mais elle affiche encore le **forfait Fashion Week
   * 7 jours à 15 000 €**, supprimé par décision d'Étienne le 15/09/2026 — elle
   * publiait donc un tarif qui n'existe plus.
   *
   * La page publique part en 301 vers la page du lieu sur le domaine
   * principal. Le projet Vercel et le code sont conservés : rien n'est
   * détruit, il suffit de retirer cette redirection pour le remettre en ligne.
   *
   * ⚠️ Seule `/` est redirigée, volontairement. `/admin` et `/api` restent
   * joignables : les surcharges de prix saisies ici vivent dans un KV distinct
   * de celui de la nouvelle application, et couper l'accès rendrait ces
   * données illisibles sans prévenir.
   */
  async redirects() {
    return [
      {
        source: "/",
        destination: "https://www.chezlesplombiers.fr/tarifs/appartement",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
