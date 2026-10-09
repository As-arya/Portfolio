"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { CertificateRecord, Media } from "../../lib/models";
import { api, uploadImage } from "./api";

type Draft = Omit<CertificateRecord, "image"> & { image: Media | null };
type Language = "id" | "en";

export default function CertificateEditor({ initial, onSaved, onBusy }: {
  initial: CertificateRecord[];
  onSaved: (entries: CertificateRecord[]) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [entries, setEntries] = useState<Draft[]>(() => structuredClone(initial));
  const [lang, setLang] = useState<Language>("id");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const baseline = useRef(initial);
  const uploaded = useRef(new Set<string>());

  useEffect(() => () => {
    void Promise.allSettled([...uploaded.current].map(publicId => api("/api/admin/media/delete", { method: "POST", body: JSON.stringify({ publicId }) })));
  }, []);

  function working(value: boolean) { setBusy(value); onBusy(value); }
  function change(id: string, value: Partial<Draft>) {
    setNotice("");
    setEntries(current => current.map(entry => entry.id === id ? { ...entry, ...value } : entry));
  }
  function translate(entry: Draft, field: "title" | "description", value: string) {
    change(entry.id, { translations: { ...entry.translations, [lang]: { ...entry.translations[lang], [field]: value } } });
  }
  function add() {
    const translation = () => ({ title: "", description: "" });
    setEntries(current => [...current, { id: crypto.randomUUID(), image: null, translations: { id: translation(), en: translation() } }]);
    setNotice("");
  }
  function reorder(index: number, direction: -1 | 1) {
    const next = [...entries];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setEntries(next); setNotice("");
  }
  async function upload(event: ChangeEvent<HTMLInputElement>, id: string) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    working(true); setError("");
    try {
      const image = await uploadImage(file);
      uploaded.current.add(image.publicId);
      change(id, { image });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Foto gagal diunggah."); }
    finally { working(false); }
  }
  async function save() {
    working(true); setError(""); setNotice("");
    try {
      const result = await api<{ certificates: CertificateRecord[] }>("/api/admin/certificates", { method: "PUT", body: JSON.stringify({ certificates: entries }) });
      const savedIds = new Set(result.certificates.map(entry => entry.image.publicId));
      const removed = [...new Set([...baseline.current.map(entry => entry.image.publicId), ...uploaded.current])].filter(id => id.startsWith("portfolio/") && !savedIds.has(id));
      baseline.current = result.certificates;
      uploaded.current.clear();
      setEntries(result.certificates); onSaved(result.certificates);
      const cleanup = await Promise.allSettled(removed.map(publicId => api("/api/admin/media/delete", { method: "POST", body: JSON.stringify({ publicId }) })));
      setNotice(cleanup.some(item => item.status === "rejected") ? "Sertifikat tersimpan. Sebagian gambar lama masih digunakan atau belum terhapus." : "Sertifikat berhasil disimpan.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sertifikat gagal disimpan."); }
    finally { working(false); }
  }

  return <section className="admin-page-section">
    <div className="admin-section-heading"><div><span className="admin-kicker">LEARNING & GROWTH</span><h1>Certificates.</h1><p className="admin-lead">Kelola foto sertifikat, judul, dan deskripsi Indonesia/English. Ganti data contoh dengan sertifikat Anda, lalu simpan.</p></div><button className="admin-button primary" disabled={busy || entries.length >= 30} onClick={add}>+ Sertifikat baru</button></div>
    <div className="admin-segment" aria-label="Bahasa sertifikat"><button disabled={busy} className={lang === "id" ? "active" : ""} onClick={() => setLang("id")}>Indonesia</button><button disabled={busy} className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button></div>
    <fieldset className="admin-certificate-list" disabled={busy}>
      {!entries.length && <p className="admin-empty">Belum ada sertifikat. Tambahkan foto dan judul untuk memulai.</p>}
      {entries.map((entry, index) => <article className="admin-panel" key={entry.id}>
        <div className="admin-inline-heading"><h2>{entry.translations[lang].title || `Sertifikat ${index + 1}`}</h2><div className="admin-mini-actions"><button aria-label={`Naikkan sertifikat ${index + 1}`} disabled={index === 0} onClick={() => reorder(index, -1)}>↑</button><button aria-label={`Turunkan sertifikat ${index + 1}`} disabled={index === entries.length - 1} onClick={() => reorder(index, 1)}>↓</button><button aria-label={`Hapus sertifikat ${index + 1}`} onClick={() => { setEntries(entries.filter(item => item.id !== entry.id)); setNotice(""); }}>×</button></div></div>
        <div className="admin-certificate-grid"><div>
          {entry.image ? <img className="admin-certificate-photo" src={entry.image.url} alt={(lang === "id" ? entry.image.altId : entry.image.altEn) || entry.translations[lang].title} /> : <div className="admin-certificate-photo admin-empty">Foto sertifikat belum diunggah.</div>}
          <label className="admin-upload">{entry.image ? "Ganti foto sertifikat" : "Unggah foto sertifikat"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void upload(event, entry.id)} /></label><p className="admin-muted">JPEG, PNG, atau WebP · maksimal 10 MB.</p>
        </div><div className="admin-form">
          <label>Judul ({lang === "id" ? "Indonesia" : "English"})<input maxLength={200} value={entry.translations[lang].title} onChange={event => translate(entry, "title", event.target.value)} /></label>
          <label>Deskripsi <small>(opsional)</small><textarea rows={5} maxLength={5000} value={entry.translations[lang].description} onChange={event => translate(entry, "description", event.target.value)} /></label>
          {entry.image && <label>Teks alternatif foto ({lang === "id" ? "Indonesia" : "English"})<input maxLength={250} value={lang === "id" ? entry.image.altId : entry.image.altEn} onChange={event => change(entry.id, { image: { ...entry.image!, [lang === "id" ? "altId" : "altEn"]: event.target.value } })} /></label>}
        </div></div>
      </article>)}
    </fieldset>
    <div className="admin-savebar"><span>Urutan di atas digunakan pada halaman Certificates.</span><button className="admin-button primary" disabled={busy} onClick={() => void save()}>{busy ? "Menyimpan…" : "Simpan sertifikat"}</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
  </section>;
}
