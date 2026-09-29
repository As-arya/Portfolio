"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { getClientAuth } from "../../../lib/firebase-client";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function reset(event: FormEvent) {
    event.preventDefault();
    const auth = getClientAuth();
    const email = process.env.NEXT_PUBLIC_PRIMARY_ADMIN_EMAIL;
    if (!auth || !email) { setMessage("Firebase atau email admin belum dikonfigurasi."); return; }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Jika akun utama tersedia, tautan reset akan dikirim ke email utama.");
    } catch { setMessage("Permintaan gagal. Coba beberapa saat lagi."); }
    finally { setBusy(false); }
  }
  return <main className="admin-auth"><div className="admin-auth-card">
    <Link className="admin-back" href="/admin/login">← Kembali ke login</Link>
    <p className="admin-kicker">ACCOUNT RECOVERY</p>
    <h1>Reset kata sandi.</h1>
    <p className="admin-muted">Tautan reset akan dikirim ke email admin utama. Jika email utama tidak dapat diakses, gunakan akun Google cadangan dari halaman login.</p>
    <form onSubmit={(event) => void reset(event)}><button className="admin-button primary wide" disabled={busy}>{busy ? "Mengirim…" : "Kirim tautan reset"}</button></form>
    {message && <p className="admin-notice" role="status">{message}</p>}
  </div></main>;
}
