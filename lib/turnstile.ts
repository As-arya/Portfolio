import { HttpError } from "./http";

export async function verifyTurnstile(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new HttpError(503, "Form kontak belum dikonfigurasi.");
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip.split(",")[0].trim());
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body, cache: "no-store",
  });
  if (!response.ok) throw new HttpError(502, "Verifikasi keamanan belum tersedia.");
  const result = await response.json() as { success?: boolean };
  if (!result.success) throw new HttpError(400, "Verifikasi keamanan gagal. Silakan coba lagi.");
}
