/**
 * Vérification d'accès administrateur (côté serveur).
 *
 * Le client envoie le mot de passe dans l'en-tête `Authorization`. On le compare
 * à la variable d'environnement `ADMIN_PASSWORD`. Aucune session persistée :
 * l'approche (portée de Chez Les Plombiers) est volontairement simple —
 * flag `sessionStorage` côté client + vérification à chaque requête admin.
 */
export function isAuthorizedAdmin(request: Request): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return request.headers.get("Authorization") === password;
}
