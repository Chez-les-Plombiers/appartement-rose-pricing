import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/kv";
import { isAuthorizedAdmin } from "@/lib/admin-auth";

/** Renvoie les demandes de devis (les plus récentes en tête, admin uniquement). */
export async function GET(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const quotes = await getQuotes();
  return NextResponse.json({ quotes });
}
