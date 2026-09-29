export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function sameOrigin(request: Request) {
  const host = request.headers.get("host");
  if (!host || request.headers.get("origin") !== `${new URL(request.url).protocol}//${host}`) {
    throw new HttpError(403, "Permintaan lintas situs ditolak.");
  }
}

export async function jsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > 1_000_000) throw new HttpError(413, "Data terlalu besar.");
  try { return JSON.parse(text); }
  catch { throw new HttpError(400, "JSON tidak valid."); }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "Data tidak valid.");
  return value as Record<string, unknown>;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json({ error: "Terjadi kesalahan server." }, { status: 500 });
}
