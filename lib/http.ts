export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function requestOrigin(request: Request): string {
  const configured = process.env.APP_ORIGIN;
  if (configured) {
    try {
      const url = new URL(configured);
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if ((url.protocol === "https:" || (local && url.protocol === "http:")) && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash) return url.origin;
    } catch {}
    throw new HttpError(503, "Origin aplikasi belum dikonfigurasi dengan benar.");
  }
  if (process.env.NODE_ENV === "production") throw new HttpError(503, "Origin aplikasi belum dikonfigurasi.");
  const host = request.headers.get("host");
  if (!host) throw new HttpError(403, "Permintaan lintas situs ditolak.");
  return `${new URL(request.url).protocol}//${host}`;
}

export function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("origin") !== requestOrigin(request)) {
    throw new HttpError(403, "Permintaan lintas situs ditolak.");
  }
}

export async function jsonBody(request: Request, maxBytes = 1_000_000): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new HttpError(415, "Gunakan Content-Type application/json.");
  const length = request.headers.get("content-length");
  if (length && Number(length) > maxBytes) throw new HttpError(413, "Data terlalu besar.");
  if (!request.body) throw new HttpError(400, "JSON tidak valid.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new HttpError(413, "Data terlalu besar.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "JSON tidak valid.");
  } finally { reader.releaseLock(); }
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
