"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth } from "../../lib/firebase-client";
import type { Block, ContactRecord, Media, ProjectRecord } from "../../lib/models";

type Tab = "overview" | "projects" | "contacts";
type Language = "id" | "en";
type Availability = "open_to_work" | "hired";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || `Permintaan gagal (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

function newProject(order: number): ProjectRecord {
  const translation = () => ({ title: "", category: "", summary: "", blocks: [] as Block[] });
  return {
    slug: "", status: "draft", order, stack: [], coverImages: [],
    translations: { id: translation(), en: translation() },
    links: { repository: "", demo: "", video: "", playStore: "" },
    placeholder: false,
  };
}

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function mediaIds(project: ProjectRecord) {
  return new Set([
    ...project.coverImages.map((image) => image.publicId),
    ...Object.values(project.translations).flatMap((translation) => translation.blocks.filter((block) => block.image).map((block) => block.image!.publicId)),
  ]);
}

function ProjectPreview({ project, lang }: { project: ProjectRecord; lang: Language }) {
  const content = project.translations[lang];
  return <div className="admin-preview">
    <span className="admin-kicker">{content.category || "Kategori proyek"}</span>
    <h2>{content.title || "Judul proyek"}</h2>
    <p>{content.summary || "Ringkasan proyek"}</p>
    {project.coverImages.length > 0 && <div className="admin-preview-covers">{project.coverImages.map((image) => <img key={image.publicId} src={image.url} alt={lang === "id" ? image.altId : image.altEn} />)}</div>}
    <div className="admin-preview-body">{content.blocks.map((block) => block.type === "image"
      ? block.image && <img key={block.id} src={block.image.url} alt={lang === "id" ? block.image.altId : block.image.altEn} />
      : block.type === "heading" ? <h3 key={block.id}>{block.text || "Judul bagian"}</h3>
        : <p key={block.id}>{block.text || "Paragraf"}</p>)}</div>
  </div>;
}

function ProjectEditor({
  initial, count, onSaved, onClose,
}: {
  initial: ProjectRecord;
  count: number;
  onSaved: (project: ProjectRecord) => void;
  onClose: () => void;
}) {
  const [project, setProject] = useState<ProjectRecord>(() => structuredClone(initial));
  const [lang, setLang] = useState<Language>("id");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const uploaded = useRef(new Set<string>());
  const translation = project.translations[lang];
  const editing = Boolean(initial.slug);

  function changeTranslation(field: "title" | "category" | "summary", value: string) {
    setProject((current) => ({ ...current, translations: { ...current.translations, [lang]: { ...current.translations[lang], [field]: value } } }));
  }
  function changeBlocks(blocks: Block[]) {
    setProject((current) => ({ ...current, translations: { ...current.translations, [lang]: { ...current.translations[lang], blocks } } }));
  }
  function changeBlock(index: number, value: Partial<Block>) {
    changeBlocks(translation.blocks.map((block, position) => position === index ? { ...block, ...value } : block));
  }
  function addBlock(type: Block["type"]) {
    changeBlocks([...translation.blocks, { id: crypto.randomUUID(), type, ...(type === "image" ? {} : { text: "" }) }]);
  }
  function changeCover(index: number, value: Partial<Media>) {
    setProject((current) => ({ ...current, coverImages: current.coverImages.map((image, position) => position === index ? { ...image, ...value } : image) }));
  }
  async function upload(file: File): Promise<Media> {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Gunakan JPEG, PNG, atau WebP maksimal 10 MB.");
    const signed = await api<{ signature: string; timestamp: number; assetFolder: string; publicIdPrefix: string; apiKey: string; cloudName: string; uploadPreset: string }>("/api/admin/upload-signature", {
      method: "POST", body: JSON.stringify({ fileSize: file.size, fileType: file.type }),
    });
    const form = new FormData();
    form.set("file", file);
    form.set("api_key", signed.apiKey);
    form.set("timestamp", String(signed.timestamp));
    form.set("asset_folder", signed.assetFolder);
    form.set("public_id_prefix", signed.publicIdPrefix);
    form.set("upload_preset", signed.uploadPreset);
    form.set("signature", signed.signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: "POST", body: form });
    if (!response.ok) throw new Error("Foto gagal diunggah ke Cloudinary.");
    const data = await response.json() as { public_id: string; secure_url: string };
    uploaded.current.add(data.public_id);
    return { publicId: data.public_id, url: data.secure_url, altId: "", altEn: "" };
  }
  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;
    setBusy(true); setError("");
    try {
      const uploaded: Media[] = [];
      for (const file of files) uploaded.push(await upload(file));
      setProject((current) => ({ ...current, coverImages: [...current.coverImages, ...uploaded] }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload gagal."); }
    finally { setBusy(false); }
  }
  async function uploadBlock(event: ChangeEvent<HTMLInputElement>, index: number) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const blockId = translation.blocks[index]?.id;
    const targetLanguage = lang;
    setBusy(true); setError("");
    try {
      const image = await upload(file);
      setProject((current) => ({ ...current, translations: {
        ...current.translations,
        [targetLanguage]: { ...current.translations[targetLanguage], blocks: current.translations[targetLanguage].blocks.map((block) => block.id === blockId ? { ...block, image } : block) },
      } }));
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Upload gagal."); }
    finally { setBusy(false); }
  }
  function canPublish() {
    return (["id", "en"] as const).every((locale) => {
      const content = project.translations[locale];
      return content.title.trim() && content.category.trim() && content.summary.trim() && content.blocks.some((block) => block.type === "image" ? block.image : block.text?.trim());
    });
  }
  async function save(status: ProjectRecord["status"]) {
    if (!editing && !project.translations.id.title.trim()) { setError("Isi judul Indonesia sebelum menyimpan proyek baru."); return; }
    if (status === "published" && !canPublish()) { setError("Lengkapi judul, kategori, ringkasan, dan konten dalam kedua bahasa sebelum terbit."); return; }
    setBusy(true); setError(""); setNote("");
    try {
      const clean = {
        ...project,
        translations: {
          id: { ...project.translations.id, blocks: project.translations.id.blocks.filter((block) => block.type !== "image" || block.image) },
          en: { ...project.translations.en, blocks: project.translations.en.blocks.filter((block) => block.type !== "image" || block.image) },
        },
      };
      const result = await api<{ project: ProjectRecord }>(editing ? `/api/admin/projects/${encodeURIComponent(initial.slug)}` : "/api/admin/projects", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ ...clean, order: editing ? project.order : count, status }),
      });
      const savedIds = mediaIds(result.project);
      const removed = [...new Set([...mediaIds(initial), ...uploaded.current])].filter((id) => !savedIds.has(id));
      if (removed.length) {
        const cleanup = await Promise.allSettled(removed.map((publicId) => api("/api/admin/media/delete", { method: "POST", body: JSON.stringify({ publicId }) })));
        if (cleanup.some((item) => item.status === "rejected")) setNote("Proyek tersimpan, tetapi sebagian foto lama tidak terhapus dari penyimpanan.");
      }
      onSaved(result.project);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Proyek gagal disimpan."); }
    finally { setBusy(false); }
  }
  async function discard() {
    if (busy) return;
    setBusy(true);
    await Promise.allSettled([...uploaded.current].map((publicId) => api("/api/admin/media/delete", { method: "POST", body: JSON.stringify({ publicId }) })));
    onClose();
  }

  return <section className="admin-editor" aria-labelledby="editor-title">
    <div className="admin-section-heading"><div><span className="admin-kicker">PROJECT EDITOR</span><h2 id="editor-title">{editing ? "Edit proyek" : "Proyek baru"}</h2></div><button className="admin-button subtle" disabled={busy} onClick={() => void discard()}>Tutup</button></div>
    <div className="admin-editor-actions">
      <div className="admin-segment" aria-label="Bahasa konten"><button className={lang === "id" ? "active" : ""} onClick={() => setLang("id")}>Indonesia</button><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button></div>
      <div className="admin-segment" aria-label="Mode editor"><button className={!preview ? "active" : ""} onClick={() => setPreview(false)}>Edit</button><button className={preview ? "active" : ""} onClick={() => setPreview(true)}>Pratinjau</button></div>
    </div>
    {preview ? <ProjectPreview project={project} lang={lang} /> : <div className="admin-editor-grid">
      <div className="admin-editor-main">
        <div className="admin-panel"><h3>Konten {lang === "id" ? "Indonesia" : "English"}</h3><div className="admin-form">
          <label>Judul<input maxLength={120} value={translation.title} onChange={(event) => changeTranslation("title", event.target.value)} /></label>
          <label>Kategori<input maxLength={80} value={translation.category} onChange={(event) => changeTranslation("category", event.target.value)} /></label>
          <label>Ringkasan<textarea rows={3} maxLength={500} value={translation.summary} onChange={(event) => changeTranslation("summary", event.target.value)} /></label>
        </div></div>
        <div className="admin-panel"><div className="admin-inline-heading"><h3>Isi detail</h3><span>{translation.blocks.length} blok</span></div>
          <div className="admin-block-list">{translation.blocks.map((block, index) => <div className="admin-block" key={block.id}>
            <div className="admin-block-head"><strong>{block.type === "heading" ? "Judul bagian" : block.type === "paragraph" ? "Paragraf" : "Gambar"}</strong><div className="admin-mini-actions"><button title="Naik" aria-label={`Naikkan blok ${index + 1}`} disabled={index === 0} onClick={() => changeBlocks(move(translation.blocks, index, -1))}>↑</button><button title="Turun" aria-label={`Turunkan blok ${index + 1}`} disabled={index === translation.blocks.length - 1} onClick={() => changeBlocks(move(translation.blocks, index, 1))}>↓</button><button title="Hapus" aria-label={`Hapus blok ${index + 1}`} onClick={() => changeBlocks(translation.blocks.filter((_, position) => position !== index))}>×</button></div></div>
            {block.type === "heading" ? <input aria-label="Teks judul bagian" maxLength={180} value={block.text || ""} onChange={(event) => changeBlock(index, { text: event.target.value })} /> : block.type === "paragraph" ? <textarea aria-label="Teks paragraf" rows={5} value={block.text || ""} onChange={(event) => changeBlock(index, { text: event.target.value })} /> : <>
              {block.image && <img className="admin-media-preview" src={block.image.url} alt={lang === "id" ? block.image.altId : block.image.altEn} />}
              <label className="admin-upload">{block.image ? "Ganti gambar" : "Unggah gambar"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => void uploadBlock(event, index)} /></label>
              {block.image && <div className="admin-form two"><label>Alt Indonesia<input value={block.image.altId} onChange={(event) => changeBlock(index, { image: { ...block.image!, altId: event.target.value } })} /></label><label>Alt English<input value={block.image.altEn} onChange={(event) => changeBlock(index, { image: { ...block.image!, altEn: event.target.value } })} /></label></div>}
            </>}
          </div>)}</div>
          <div className="admin-inline-actions"><button className="admin-button subtle" onClick={() => addBlock("heading")}>+ Judul</button><button className="admin-button subtle" onClick={() => addBlock("paragraph")}>+ Paragraf</button><button className="admin-button subtle" onClick={() => addBlock("image")}>+ Gambar</button></div>
        </div>
      </div>
      <aside className="admin-editor-side">
        <div className="admin-panel"><h3>Foto sampul</h3><p className="admin-muted">Beberapa foto akan tampil sebagai tumpukan pada detail proyek.</p>
          <div className="admin-cover-list">{project.coverImages.map((image, index) => <div className="admin-cover" key={image.publicId}><img src={image.url} alt={image.altId || `Sampul ${index + 1}`} /><div className="admin-mini-actions"><button aria-label={`Naikkan foto ${index + 1}`} disabled={index === 0} onClick={() => setProject((current) => ({ ...current, coverImages: move(current.coverImages, index, -1) }))}>↑</button><button aria-label={`Turunkan foto ${index + 1}`} disabled={index === project.coverImages.length - 1} onClick={() => setProject((current) => ({ ...current, coverImages: move(current.coverImages, index, 1) }))}>↓</button><button aria-label={`Hapus foto ${index + 1}`} onClick={() => setProject((current) => ({ ...current, coverImages: current.coverImages.filter((_, position) => position !== index) }))}>×</button></div><label>Alt Indonesia<input value={image.altId} onChange={(event) => changeCover(index, { altId: event.target.value })} /></label><label>Alt English<input value={image.altEn} onChange={(event) => changeCover(index, { altEn: event.target.value })} /></label></div>)}</div>
          <label className="admin-upload">+ Tambah foto<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(event) => void uploadCover(event)} /></label>
        </div>
        <div className="admin-panel"><h3>Metadata & tautan</h3><div className="admin-form"><label>Teknologi <small>(pisahkan dengan koma)</small><input value={project.stack.join(", ")} onChange={(event) => setProject((current) => ({ ...current, stack: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} /></label>{(["repository", "demo", "video", "playStore"] as const).map((key) => <label key={key}>{key === "playStore" ? "Google Play" : key === "repository" ? "Repository" : key === "demo" ? "Live demo" : "Video"}<input type="url" placeholder="https://" value={project.links[key]} onChange={(event) => setProject((current) => ({ ...current, links: { ...current.links, [key]: event.target.value } }))} /></label>)}</div></div>
      </aside>
    </div>}
    <div className="admin-savebar"><span>{editing ? `/${initial.slug}` : "Slug dibuat dari judul Indonesia saat pertama disimpan."}</span><div><button className="admin-button subtle" disabled={busy} onClick={() => void save("draft")}>{busy ? "Menyimpan…" : "Simpan draft"}</button><button className="admin-button primary" disabled={busy} onClick={() => void save("published")}>Terbitkan</button></div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{note && <p className="admin-notice" role="status">{note}</p>}
  </section>;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [availability, setAvailability] = useState<Availability>("open_to_work");
  const [editing, setEditing] = useState<ProjectRecord | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api<{ role: "primary" | "recovery" }>("/api/admin/session")
      .then(async ({ role }) => {
        if (role !== "primary") { router.replace("/admin/recovery"); return; }
        const [projectData, settingData, contactData] = await Promise.all([
          api<{ projects: ProjectRecord[] }>("/api/admin/projects"),
          api<{ availability: Availability }>("/api/admin/settings"),
          api<{ contacts: ContactRecord[] }>("/api/admin/contacts"),
        ]);
        setProjects(projectData.projects.sort((a, b) => a.order - b.order));
        setAvailability(settingData.availability);
        setContacts(contactData.contacts);
        setReady(true);
      }).catch((cause) => {
        if (cause instanceof Error && cause.message.includes("401")) router.replace("/admin/login");
        else setError(cause instanceof Error ? cause.message : "Data admin gagal dimuat.");
      });
  }, [router]);

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    const auth = getClientAuth();
    if (auth) await signOut(auth).catch(() => {});
    router.replace("/admin/login");
  }
  async function updateAvailability(value: Availability) {
    setBusy(true); setError("");
    try { const data = await api<{ availability: Availability }>("/api/admin/settings", { method: "PUT", body: JSON.stringify({ availability: value }) }); setAvailability(data.availability); setNotice("Status kerja diperbarui."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Status gagal diperbarui."); }
    finally { setBusy(false); }
  }
  async function reorder(index: number, direction: -1 | 1) {
    setBusy(true); setError("");
    try {
      const next = move(projects, index, direction);
      const result = await api<{ projects: ProjectRecord[] }>("/api/admin/projects/order", { method: "POST", body: JSON.stringify({ slugs: next.map((project) => project.slug) }) });
      setProjects(result.projects.sort((a, b) => a.order - b.order));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Urutan gagal disimpan."); }
    finally { setBusy(false); }
  }
  async function changeStatus(project: ProjectRecord) {
    setBusy(true); setError("");
    try {
      const result = await api<{ project: ProjectRecord }>(`/api/admin/projects/${encodeURIComponent(project.slug)}`, { method: "PUT", body: JSON.stringify({ ...project, status: project.status === "published" ? "draft" : "published" }) });
      setProjects((current) => current.map((item) => item.slug === result.project.slug ? result.project : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Status proyek gagal diubah."); }
    finally { setBusy(false); }
  }
  function onSaved(project: ProjectRecord) {
    setProjects((current) => {
      const existing = current.some((item) => item.slug === project.slug);
      return (existing ? current.map((item) => item.slug === project.slug ? project : item) : [...current, project]).sort((a, b) => a.order - b.order);
    });
    setEditing(null); setNotice("Proyek berhasil disimpan.");
  }
  async function selectContact(contact: ContactRecord) {
    setSelectedContact(contact.id);
    if (contact.read) return;
    try {
      const result = await api<{ contact: ContactRecord }>(`/api/admin/contacts/${encodeURIComponent(contact.id)}`, { method: "PATCH", body: JSON.stringify({ read: true }) });
      setContacts((current) => current.map((item) => item.id === contact.id ? result.contact : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Pesan gagal ditandai terbaca."); }
  }
  async function retry(contact: ContactRecord) {
    setBusy(true); setError("");
    try {
      const result = await api<{ contact: ContactRecord }>(`/api/admin/contacts/${encodeURIComponent(contact.id)}/retry`, { method: "POST" });
      setContacts((current) => current.map((item) => item.id === contact.id ? result.contact : item));
      if (result.contact.emailStatus === "sent") setNotice("Notifikasi email berhasil dikirim ulang.");
      else setError("Email masih gagal dikirim. Pesan tetap tersimpan di admin.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Email gagal dikirim ulang."); }
    finally { setBusy(false); }
  }
  const activeContact = contacts.find((contact) => contact.id === selectedContact);
  if (!ready) return <main className="admin-loading"><p>Memuat admin…</p>{error && <p className="admin-error" role="alert">{error} <Link href="/admin/login">Kembali ke login</Link></p>}</main>;

  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link href="/" className="admin-brand"><span>A</span><strong>ASARYA / ADMIN</strong></Link><nav aria-label="Navigasi admin">
      {(["overview", "projects", "contacts"] as const).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); setEditing(null); setError(""); }}>
        {item === "overview" ? "Ringkasan" : item === "projects" ? "Proyek" : "Pesan"}{item === "contacts" && contacts.some((contact) => !contact.read) && <span className="admin-dot" aria-label="Ada pesan belum dibaca" />}
      </button>)}
    </nav><div className="admin-sidebar-foot"><Link href="/" target="_blank">Lihat situs ↗</Link><button onClick={() => void logout()}>Keluar</button></div></aside>
    <div className="admin-content"><header className="admin-topbar"><span className="admin-kicker">CONTENT MANAGEMENT</span><span>Akun utama · <span className="admin-online">Aktif</span></span></header>
      {error && <p className="admin-error" role="alert">{error} <button onClick={() => setError("")} aria-label="Tutup pesan kesalahan">×</button></p>}
      {notice && <p className="admin-notice" role="status">{notice} <button onClick={() => setNotice("")} aria-label="Tutup pemberitahuan">×</button></p>}
      {tab === "overview" && <section className="admin-page-section"><span className="admin-kicker">DASHBOARD</span><h1>Selamat datang.</h1><p className="admin-lead">Kelola status kerja, karya, dan pesan dari satu tempat.</p>
        <div className="admin-stats"><div><strong>{projects.length}</strong><span>Proyek</span></div><div><strong>{projects.filter((project) => project.status === "published").length}</strong><span>Terbit</span></div><div><strong>{contacts.filter((contact) => !contact.read).length}</strong><span>Pesan baru</span></div></div>
        <section className="admin-panel admin-status-panel"><div><span className="admin-kicker">AVAILABILITY</span><h2>Status kerja</h2><p className="admin-muted">Label ini tampil di bagian Hero portofolio.</p></div><div className="admin-status-buttons"><button className={availability === "open_to_work" ? "selected" : ""} disabled={busy} onClick={() => void updateAvailability("open_to_work")}>Open to work</button><button className={availability === "hired" ? "selected" : ""} disabled={busy} onClick={() => void updateAvailability("hired")}>Hired</button></div></section>
        <div className="admin-quick-actions"><button className="admin-button primary" onClick={() => { setTab("projects"); setEditing(newProject(projects.length)); }}>+ Tambah proyek</button><button className="admin-button subtle" onClick={() => setTab("contacts")}>Buka pesan</button></div>
      </section>}
      {tab === "projects" && (editing ? <ProjectEditor key={editing.slug || "new"} initial={editing} count={projects.length} onSaved={onSaved} onClose={() => setEditing(null)} /> : <section className="admin-page-section"><div className="admin-section-heading"><div><span className="admin-kicker">PORTFOLIO CONTENT</span><h1>Proyek.</h1><p className="admin-lead">Atur urutan, konten, dan visibilitas proyek.</p></div><button className="admin-button primary" onClick={() => setEditing(newProject(projects.length))}>+ Proyek baru</button></div><div className="admin-project-list">{projects.map((project, index) => <article className="admin-project-row" key={project.slug}>
        <div className="admin-project-thumb">{project.coverImages[0] ? <img src={project.coverImages[0].url} alt={project.coverImages[0].altId} /> : <span>◇</span>}</div><div className="admin-project-info"><div><span className={`admin-badge ${project.status}`}>{project.status === "published" ? "Terbit" : "Draft"}</span><span className="admin-muted">/{project.slug}</span></div><h2>{project.translations.id.title || "Tanpa judul"}</h2><p>{project.translations.en.title || "Judul English belum diisi"}</p></div><div className="admin-project-actions"><div className="admin-mini-actions"><button aria-label={`Naikkan ${project.translations.id.title}`} disabled={busy || index === 0} onClick={() => void reorder(index, -1)}>↑</button><button aria-label={`Turunkan ${project.translations.id.title}`} disabled={busy || index === projects.length - 1} onClick={() => void reorder(index, 1)}>↓</button></div><button className="admin-button subtle" onClick={() => setEditing(project)}>Edit</button><button className="admin-button subtle" disabled={busy} onClick={() => void changeStatus(project)}>{project.status === "published" ? "Sembunyikan" : "Terbitkan"}</button>{project.status === "published" && <Link className="admin-button subtle" href={`/projects/${project.slug}`} target="_blank">Lihat ↗</Link>}</div>
      </article>)}</div></section>)}
      {tab === "contacts" && <section className="admin-page-section"><div className="admin-section-heading"><div><span className="admin-kicker">INBOX</span><h1>Pesan masuk.</h1><p className="admin-lead">Seluruh pesan Contact tersimpan di sini.</p></div><a className="admin-button subtle" href="/api/admin/contacts/export" download>Ekspor CSV ↓</a></div><div className="admin-inbox"><div className="admin-message-list">{contacts.length ? contacts.map((contact) => <button key={contact.id} className={`${selectedContact === contact.id ? "selected" : ""} ${!contact.read ? "unread" : ""}`} onClick={() => void selectContact(contact)}><span><strong>{contact.name}</strong><small>{new Date(contact.createdAt).toLocaleString("id-ID")}</small></span><span>{contact.email}</span><p>{contact.message}</p></button>) : <p className="admin-empty">Belum ada pesan masuk.</p>}</div><div className="admin-message-detail">{activeContact ? <><div className="admin-message-header"><span className="admin-kicker">CONTACT MESSAGE</span><h2>{activeContact.name}</h2><a href={`mailto:${activeContact.email}`}>{activeContact.email}</a><time dateTime={activeContact.createdAt}>{new Date(activeContact.createdAt).toLocaleString("id-ID")}</time></div><p className="admin-message-body">{activeContact.message}</p><div className="admin-message-foot"><span className={`admin-badge ${activeContact.emailStatus}`}>Email {activeContact.emailStatus === "sent" ? "terkirim" : activeContact.emailStatus === "failed" ? "gagal" : "menunggu"}</span>{activeContact.emailStatus === "failed" && <button className="admin-button subtle" disabled={busy} onClick={() => void retry(activeContact)}>Kirim ulang email</button>}{activeContact.read && <button className="admin-button subtle" disabled={busy} onClick={() => void api<{ contact: ContactRecord }>(`/api/admin/contacts/${encodeURIComponent(activeContact.id)}`, { method: "PATCH", body: JSON.stringify({ read: false }) }).then(({ contact }) => setContacts((current) => current.map((item) => item.id === contact.id ? contact : item))).catch((cause) => setError(cause instanceof Error ? cause.message : "Gagal."))}>Tandai belum dibaca</button>}</div>{activeContact.emailError && <p className="admin-muted">Keterangan email: {activeContact.emailError}</p>}</> : <p className="admin-empty">Pilih pesan untuk membaca isinya.</p>}</div></div></section>}
    </div>
  </main>;
}
