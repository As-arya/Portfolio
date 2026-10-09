import { HttpError } from "./http";

export async function verifyTurnstile(token: string, hostname: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new HttpError(503, "Form kontak belum dikonfigurasi.");
  const testKey = /^[123]x0{10,}/.test(secret);
  if (process.env.NODE_ENV === "production" && (testKey || /^[123]x0{10,}/.test(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""))) throw new HttpError(503, "Form kontak belum memakai verifikasi produksi.");
  if (!token || token.length > 2048) throw new HttpError(400, "Verifikasi keamanan tidak valid.");
  const body = new URLSearchParams({ secret, response: token });
  let result: { success?: boolean; hostname?: string; action?: string };
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Siteverify unavailable");
    result = await response.json();
  } catch { throw new HttpError(502, "Verifikasi keamanan belum tersedia."); }
  if (result?.success !== true || (!testKey && (result.hostname !== hostname || result.action !== "contact"))) throw new HttpError(400, "Verifikasi keamanan gagal. Silakan coba lagi.");
}
