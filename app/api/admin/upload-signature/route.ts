import { requirePrimary } from "../../../../lib/auth";
import { cloudinaryClient, MAX_IMAGE_BYTES } from "../../../../lib/cloudinary";
import { errorResponse, HttpError, jsonBody, object, sameOrigin } from "../../../../lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const { fileSize, fileType } = object(await jsonBody(request));
    if (typeof fileSize !== "number" || !Number.isInteger(fileSize) || fileSize < 1 || fileSize > MAX_IMAGE_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(String(fileType))) {
      throw new HttpError(400, "Gambar harus JPEG, PNG, atau WebP maksimal 10 MB.");
    }
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!uploadPreset) throw new HttpError(503, "Preset Cloudinary belum dikonfigurasi.");
    const { cloudinary, cloudName, apiKey, apiSecret } = cloudinaryClient();
    const timestamp = Math.floor(Date.now() / 1000);
    const assetFolder = "portfolio";
    const publicIdPrefix = "portfolio";
    const signature = cloudinary.utils.api_sign_request({ timestamp, asset_folder: assetFolder, public_id_prefix: publicIdPrefix, upload_preset: uploadPreset }, apiSecret);
    return Response.json({ signature, timestamp, assetFolder, publicIdPrefix, uploadPreset, apiKey, cloudName, maxFileSize: MAX_IMAGE_BYTES, allowedFormats: ["jpg", "png", "webp"] });
  } catch (error) { return errorResponse(error); }
}
