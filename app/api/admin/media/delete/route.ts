import { requirePrimary } from "../../../../../lib/auth";
import { cloudinaryClient } from "../../../../../lib/cloudinary";
import { errorResponse, HttpError, jsonBody, object, sameOrigin } from "../../../../../lib/http";
import { getAllProjects, getCertificates, getEducation } from "../../../../../lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const publicId = object(await jsonBody(request)).publicId;
    if (typeof publicId !== "string" || !/^portfolio\/[a-zA-Z0-9_/-]{1,200}$/.test(publicId)) throw new HttpError(400, "ID gambar tidak valid.");
    const [projects, certificates, education] = await Promise.all([getAllProjects(), getCertificates(), getEducation()]);
    const inUse = education.some(entry => entry.logo?.publicId === publicId) || certificates.some(certificate => certificate.image.publicId === publicId) || projects.some(project =>
      project.coverImages.some(image => image.publicId === publicId) ||
      [project.translations.id, project.translations.en].some(locale => locale.blocks.some(block => block.image?.publicId === publicId))
    );
    if (inUse) throw new HttpError(409, "Simpan perubahan konten sebelum menghapus gambar yang digunakan.");
    const result = await cloudinaryClient().cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") throw new HttpError(502, "Gagal menghapus gambar.");
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
