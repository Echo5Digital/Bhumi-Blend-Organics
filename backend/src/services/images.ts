import { v2 as cloudinary } from "cloudinary";
import type { Env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

// Image storage on Cloudinary, behind a small interface (like payments) so the
// tests never upload anything. Until the three CLOUDINARY_* keys are in `.env`,
// `configured` is false and uploads answer 503.

export type StoredImage = { url: string; publicId: string; width?: number; height?: number; bytes?: number };

export interface ImageStore {
  readonly configured: boolean;
  /** Upload a file held in memory (an admin's upload from the browser). */
  upload(file: Buffer, options?: { folder?: string }): Promise<StoredImage>;
  /** Upload a file from disk under a fixed id (the one-off migration of the existing photos). */
  uploadFile(path: string, options: { publicId: string }): Promise<StoredImage>;
  remove(publicId: string): Promise<void>;
}

function toStored(result: {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  bytes?: number;
}): StoredImage {
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

export function createCloudinaryStore(
  env: Pick<Env, "CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET" | "CLOUDINARY_FOLDER">,
): ImageStore {
  const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
  if (configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  const requireConfigured = () => {
    if (!configured) throw HttpError.unavailable("Image uploads are not set up yet.", "IMAGES_NOT_CONFIGURED");
  };

  return {
    configured,

    async upload(file, options = {}) {
      requireConfigured();
      return new Promise<StoredImage>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder ?? env.CLOUDINARY_FOLDER,
            resource_type: "image",
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error || !result) reject(error ?? new Error("Cloudinary returned no result"));
            else resolve(toStored(result));
          },
        );
        stream.end(file);
      });
    },

    async uploadFile(path, { publicId }) {
      requireConfigured();
      const result = await cloudinary.uploader.upload(path, {
        folder: env.CLOUDINARY_FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        use_filename: false,
      });
      return toStored(result);
    },

    async remove(publicId) {
      requireConfigured();
      await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
    },
  };
}
