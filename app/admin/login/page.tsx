"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { getClientAuth } from "../../../lib/firebase-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(kind: "password" | "google") {
    const auth = getClientAuth();
    if (!auth) { setError("Firebase belum dikonfigurasi. Isi .env.local lebih dulu."); return; }
    setBusy(true);
    setError("");
    try {
      const credential = kind === "password"
        ? await signInWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithPopup(auth, new GoogleAuthProvider());
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await credential.user.getIdToken() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || "Login admin gagal.");
      }
      const { role } = await response.json() as { role: "primary" | "recovery" };
      router.replace(role === "primary" ? "/admin" : "/admin/recovery");
      router.refresh();
    } catch (cause) {
      await signOut(auth).catch(() => {});
      setError(cause instanceof Error ? cause.message : "Login gagal. Coba lagi.");
    } finally { setBusy(false); }
  }

  return <main className="admin-auth">
    <div className="admin-auth-card">
      <Link className="admin-back" href="/">← Kembali ke portofolio</Link>
      <p className="admin-kicker">PORTFOLIO CONTROL</p>
      <h1>Masuk ke admin.</h1>
      <p className="admin-muted">Gunakan akun utama untuk mengelola portofolio.</p>
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); void signIn("password"); }} className="admin-form">
        <label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Kata sandi<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="admin-button primary" disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button>
      </form>
      <div className="admin-auth-links"><Link href="/admin/forgot-password">Lupa kata sandi?</Link></div>
      <div className="admin-divider"><span>Pemulihan cadangan</span></div>
      <button className="admin-button subtle wide" type="button" onClick={() => void signIn("google")} disabled={busy}>Masuk dengan akun Google cadangan</button>
      {error && <p className="admin-error" role="alert">{error}</p>}
    </div>
  </main>;
}
