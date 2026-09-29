import { v2 as cloudinary } from "cloudinary";
import { HttpError } from "./http";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function cloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new HttpError(503, "Cloudinary belum dikonfigurasi.");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudinary, cloudName, apiKey, apiSecret };
}
