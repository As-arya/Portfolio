import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const problems = [];
const required = [
  "APP_ORIGIN", "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID", "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY", "PRIMARY_ADMIN_UID", "PRIMARY_ADMIN_EMAIL",
  "BACKUP_ADMIN_UID", "BACKUP_ADMIN_EMAIL", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET", "CLOUDINARY_UPLOAD_PRESET", "NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY",
];
for (const key of required) if (!process.env[key]?.trim()) problems.push(`${key} belum diisi.`);
try {
  const url = new URL(process.env.APP_ORIGIN);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) problems.push("APP_ORIGIN harus origin HTTPS domain deploy, tanpa path atau kredensial.");
} catch { if (process.env.APP_ORIGIN) problems.push("APP_ORIGIN tidak valid."); }
for (const key of ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]) {
  if (/^[123]x0{10,}/.test(process.env[key] ?? "")) problems.push(`${key} masih kunci tes; ganti dengan kunci produksi.`);
}
if (process.env.PRIMARY_ADMIN_UID && process.env.PRIMARY_ADMIN_UID === process.env.BACKUP_ADMIN_UID) problems.push("UID primary dan backup harus berbeda.");
if (process.env.PRIMARY_ADMIN_EMAIL && process.env.PRIMARY_ADMIN_EMAIL.toLowerCase() === process.env.BACKUP_ADMIN_EMAIL?.toLowerCase()) problems.push("Email primary dan backup harus berbeda.");
if (process.env.FIREBASE_PROJECT_ID !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) problems.push("Project Firebase client dan server harus sama.");
if (problems.length) {
  console.error("Belum siap deploy:\n" + problems.map(problem => `- ${problem}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Konfigurasi ENV dasar lulus. Lanjutkan audit npm, build, tes produksi, dan checklist layanan di docs/SECURITY_AUDIT.md.");
}
