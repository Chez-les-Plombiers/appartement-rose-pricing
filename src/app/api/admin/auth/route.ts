import { NextResponse } from "next/server";

/**
 * Authentification administrateur par mot de passe.
 * Renvoie le mot de passe comme « token » : le client le conserve en
 * sessionStorage et le renvoie dans l'en-tête Authorization des API admin.
 */
export async function POST(request: Request) {
  let password: unknown;
  try {
    ({ password } = (await request.json()) as { password?: unknown });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  return NextResponse.json({ token: adminPassword });
}
