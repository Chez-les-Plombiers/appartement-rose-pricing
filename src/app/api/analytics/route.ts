import { NextResponse } from "next/server";
import { incrementDayView } from "@/lib/kv";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Enregistre une vue de jour (analytics légères).
 * Best-effort : no-op silencieux si KV absent ; toujours 200 sur succès.
 */
export async function POST(request: Request) {
  if (!(await rateLimit("rose-analytics", clientIp(request), 30))) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  let date: unknown;
  try {
    ({ date } = (await request.json()) as { date?: unknown });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (typeof date !== "string" || !DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  await incrementDayView(date).catch(() => {
    // best-effort : on ignore les erreurs KV.
  });

  return NextResponse.json({ success: true });
}
