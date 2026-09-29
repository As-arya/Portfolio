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
  useEffect(() => {
    fetch("/api/admin/session").then(async (response) => {
      if (!response.ok) { router.replace("/admin/login"); return; }
      const { role } = await response.json() as { role: "primary" | "recovery" };
      if (role === "primary") router.replace("/admin");
      else setReady(true);
    }).catch(() => router.replace("/admin/login"));
  }, [router]);
  async function sendReset() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/recovery", { method: "POST" });
      if (!response.ok) throw new Error(response.status === 429 ? "Tunggu 15 menit sebelum meminta ulang." : "Tautan tidak dapat dikirim.");
      setMessage("Tautan reset akun utama telah dikirim ke email cadangan.");
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
    <p className="admin-muted">Akun cadangan hanya dapat meminta tautan reset. Tautan dikirim ke email cadangan yang terdaftar.</p>
    <button className="admin-button primary wide" disabled={!ready || busy} onClick={() => void sendReset()}>{busy ? "Mengirim…" : "Kirim tautan reset"}</button>
    {message && <p className="admin-notice" role="status">{message}</p>}
    <div className="admin-auth-links"><button type="button" onClick={() => void logout()}>Keluar</button><Link href="/">Portofolio</Link></div>
  </div></main>;
}
