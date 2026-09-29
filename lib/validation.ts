import { HttpError, object } from "./http";
import type { Block, Media, ProjectLocale, ProjectRecord } from "./models";

function text(value: unknown, field: string, max: number, min = 0) {
  if (typeof value !== "string") throw new HttpError(400, `${field} tidak valid.`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) throw new HttpError(400, `${field} harus ${min}–${max} karakter.`);
  return trimmed;
}

function list(value: unknown, field: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new HttpError(400, `${field} tidak valid.`);
  return value;
}

function link(value: unknown, field: string) {
  const url = text(value, field, 500);
  if (!url) return "";
  try { if (["http:", "https:"].includes(new URL(url).protocol)) return url; } catch {}
  throw new HttpError(400, `${field} harus URL HTTP atau HTTPS.`);
}

function media(value: unknown): Media {
  const source = object(value);
  const publicId = text(source.publicId, "ID gambar", 250, 1);
  const url = link(source.url, "URL gambar");
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!/^portfolio\/[a-zA-Z0-9_/-]{1,200}$/.test(publicId) || !url || (cloud && !url.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`))) {
    throw new HttpError(400, "Gambar harus berasal dari folder Cloudinary portfolio.");
  }
  return { publicId, url, altId: text(source.altId, "Alt Indonesia", 250), altEn: text(source.altEn, "Alt English", 250) };
}

function locale(value: unknown, language: string): ProjectLocale {
  const source = object(value);
  const blocks: Block[] = list(source.blocks, `Blok ${language}`, 100).map(raw => {
    const block = object(raw);
    const id = text(block.id, "ID blok", 80, 1);
    const type = block.type;
    if (type === "image") return { id, type, image: media(block.image) };
    if (type === "heading" || type === "paragraph") return { id, type, text: text(block.text, "Teks blok", type === "heading" ? 200 : 10000) };
    throw new HttpError(400, "Tipe blok tidak valid.");
  });
  if (new Set(blocks.map(block => block.id)).size !== blocks.length) throw new HttpError(400, "ID blok ganda.");
  return {
    title: text(source.title, `Judul ${language}`, 160),
    category: text(source.category, `Kategori ${language}`, 100),
    summary: text(source.summary, `Ringkasan ${language}`, 1000),
    blocks,
  };
}

export function validateProject(value: unknown): ProjectRecord {
  const source = object(value);
  const slug = text(source.slug, "Slug", 80, 1);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new HttpError(400, "Slug tidak valid.");
  if (source.status !== "draft" && source.status !== "published") throw new HttpError(400, "Status proyek tidak valid.");
  if (!Number.isInteger(source.order) || (source.order as number) < 0 || (source.order as number) > 10000) throw new HttpError(400, "Urutan proyek tidak valid.");
  const translations = object(source.translations);
  const links = object(source.links);
  const result: ProjectRecord = {
    slug,
    status: source.status,
    order: source.order as number,
    stack: list(source.stack, "Teknologi", 30).map(tag => text(tag, "Teknologi", 50, 1)),
    coverImages: list(source.coverImages, "Foto sampul", 20).map(media),
    translations: { id: locale(translations.id, "Indonesia"), en: locale(translations.en, "English") },
    links: {
      repository: link(links.repository, "Repository"),
      demo: link(links.demo, "Demo"),
      video: link(links.video, "Video"),
      playStore: link(links.playStore, "Play Store"),
    },
    placeholder: source.placeholder === true,
  };
  if (result.status === "published" && [result.translations.id, result.translations.en].some(t =>
    !t.title || !t.category || !t.summary || !t.blocks.some(b => b.type === "image" || !!b.text)
  )) throw new HttpError(400, "Isi kedua bahasa harus lengkap sebelum terbit.");
  return result;
}

export function slugFromTitle(value: unknown) {
  const title = text(value, "Judul Indonesia", 160, 1);
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "project";
}

export function validateContact(value: unknown) {
  const source = object(value);
  const email = text(source.email, "Email", 254, 3).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email tidak valid.");
  const name = text(source.name, "Nama", 100, 2);
  if (/[\u0000-\u001f\u007f]/.test(name)) throw new HttpError(400, "Nama tidak valid.");
  return {
    name,
    email,
    message: text(source.message, "Pesan", 5000, 10),
    turnstileToken: text(source.turnstileToken, "Verifikasi keamanan", 4096, 1),
  };
}
