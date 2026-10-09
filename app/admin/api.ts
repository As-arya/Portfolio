import type { Media } from "../../lib/models";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
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

export async function uploadImage(file: File): Promise<Media> {
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
  return { publicId: data.public_id, url: data.secure_url, altId: "", altEn: "" };
}
