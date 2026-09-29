import { cookies } from "next/headers";
import { auth } from "./firebase-admin";
import { HttpError } from "./http";

export const SESSION_COOKIE = "portfolio_session";
export const SESSION_AGE_MS = 5 * 24 * 60 * 60 * 1000;
export type AdminRole = "primary" | "recovery";

export function roleForUser(uid: string, email?: string, provider?: string, emailVerified?: boolean): AdminRole | null {
  const address = email?.toLowerCase();
  if (uid === process.env.PRIMARY_ADMIN_UID && address === process.env.PRIMARY_ADMIN_EMAIL?.toLowerCase() && provider === "password") return "primary";
  if (uid === process.env.BACKUP_ADMIN_UID && address === process.env.BACKUP_ADMIN_EMAIL?.toLowerCase() && provider === "google.com" && emailVerified) return "recovery";
  return null;
}

export async function roleFromIdToken(idToken: string): Promise<AdminRole> {
  const token = await auth().verifyIdToken(idToken, true).catch(() => { throw new HttpError(401, "Token login tidak valid."); });
  if (Date.now() / 1000 - token.auth_time > 5 * 60) throw new HttpError(401, "Silakan login ulang.");
  const role = roleForUser(token.uid, token.email, token.firebase.sign_in_provider, token.email_verified);
  if (!role) throw new HttpError(403, "Akun ini tidak memiliki akses.");
  return role;
}

export async function sessionRole(): Promise<AdminRole | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const token = await auth().verifySessionCookie(value, true);
    return roleForUser(token.uid, token.email, token.firebase.sign_in_provider, token.email_verified);
  } catch { return null; }
}

export async function requirePrimary() {
  if (await sessionRole() !== "primary") throw new HttpError(401, "Login admin diperlukan.");
}

export async function requireRecovery() {
  if (await sessionRole() !== "recovery") throw new HttpError(401, "Akun pemulihan diperlukan.");
}
