import cloudinary from "../config/cloudinary";
import { Readable } from "stream";

/**
 * Uploads an image file to Cloudinary
 * @param file - The file buffer from multer
 * @param folder - The Cloudinary folder name (default: 'profile-images')
 * @returns The secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (
  file: Express.Multer.File,
  folder: string = "profile-images"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload error: ${error.message}`));
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Upload failed with no result"));
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const bufferStream = Readable.from(file.buffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Deletes an image from Cloudinary by URL
 * @param imageUrl - The public URL of the image to delete
 */
export const deleteImageFromCloudinary = async (
  imageUrl: string
): Promise<void> => {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split("/");
    const fileWithExt = urlParts[urlParts.length - 1];
    const publicId = fileWithExt.split(".")[0];
    const folder = urlParts[urlParts.length - 2];
    const fullPublicId = `${folder}/${publicId}`;

    await cloudinary.uploader.destroy(fullPublicId);
  } catch (error: any) {
    console.error("Image deletion error:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};
