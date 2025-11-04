import { supabase } from "../config/supabaseClient";

/**
 * Uploads an image file to Supabase storage
 * @param file - The file buffer or File object
 * @param fileName - The desired file name
 * @param bucket - The Supabase bucket name (default: 'profile-images')
 * @returns The public URL of the uploaded image
 */
export const uploadImageToSupabase = async (
  file: Buffer | File,
  fileName: string,
  bucket: string = "profile-images"
): Promise<string> => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        contentType: "image/*",
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return publicUrl;
  } catch (error: any) {
    console.error("Image upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Deletes an image from Supabase storage by URL
 * @param imageUrl - The public URL of the image to delete
 * @param bucket - The Supabase bucket name (default: 'profile-images')
 */
export const deleteImageFromSupabase = async (
  imageUrl: string,
  bucket: string = "profile-images"
): Promise<void> => {
  try {
    // Extract the file path from the URL
    const urlParts = imageUrl.split(`${bucket}/`);
    if (urlParts.length < 2) {
      throw new Error("Invalid image URL format");
    }
    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }
  } catch (error: any) {
    console.error("Image deletion error:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};
