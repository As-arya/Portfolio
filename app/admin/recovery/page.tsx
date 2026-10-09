"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth } from "../../../lib/firebase-client";

export default function RecoveryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  useEffect(() => {
    fetch("/api/admin/session").then(async (response) => {
      if (!response.ok) { router.replace("/admin/login"); return; }
      const { role } = await response.json() as { role: "primary" | "recovery" };
      if (role === "primary") router.replace("/admin");
      else setReady(true);
    }).catch(() => router.replace("/admin/login"));
  }, [router]);
  async function createReset() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/recovery", { method: "POST" });
      const body = await response.json() as { resetLink?: string; error?: string };
      if (!response.ok || !body.resetLink) throw new Error(body.error || "Tautan reset tidak dapat dibuat.");
      setResetLink(body.resetLink);
      setMessage("Tautan reset siap. Buka tombol di bawah untuk mengganti kata sandi akun utama.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Permintaan gagal."); }
    finally { setBusy(false); }
  }
  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    const auth = getClientAuth();
    if (auth) await signOut(auth).catch(() => {});
    router.replace("/admin/login");
  }
  return <main className="admin-auth"><div className="admin-auth-card">
    <p className="admin-kicker">BACKUP ACCESS</p>
    <h1>Pulihkan akun utama.</h1>
    <p className="admin-muted">Akun cadangan hanya dapat membuat tautan reset akun utama. Tautan ditampilkan di halaman ini setelah dibuat.</p>
    <button className="admin-button primary wide" disabled={!ready || busy || !!resetLink} onClick={() => void createReset()}>{busy ? "Membuat tautan…" : "Buat tautan reset"}</button>
    {message && <p className="admin-notice" role="status">{message}</p>}
    {resetLink && <a className="admin-button primary wide" href={resetLink} target="_blank" rel="noreferrer">Reset kata sandi akun utama ↗</a>}
    <div className="admin-auth-links"><button type="button" onClick={() => void logout()}>Keluar</button><Link href="/">Portofolio</Link></div>
  </div></main>;
}
