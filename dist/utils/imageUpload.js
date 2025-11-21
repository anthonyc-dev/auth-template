"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromSupabase = exports.uploadImageToSupabase = void 0;
const supabaseClient_1 = require("../config/supabaseClient");
/**
 * Uploads an image file to Supabase storage
 * @param file - The file buffer or File object
 * @param fileName - The desired file name
 * @param bucket - The Supabase bucket name (default: 'profile-images')
 * @returns The public URL of the uploaded image
 */
const uploadImageToSupabase = (file_1, fileName_1, ...args_1) => __awaiter(void 0, [file_1, fileName_1, ...args_1], void 0, function* (file, fileName, bucket = "profile-images") {
    try {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}-${fileName}`;
        // Upload file to Supabase storage
        const { data, error } = yield supabaseClient_1.supabase.storage
            .from(bucket)
            .upload(uniqueFileName, file, {
            contentType: "image/*",
            upsert: false,
        });
        if (error) {
            throw new Error(`Supabase upload error: ${error.message}`);
        }
        // Get public URL
        const { data: { publicUrl }, } = supabaseClient_1.supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    }
    catch (error) {
        console.error("Image upload error:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
});
exports.uploadImageToSupabase = uploadImageToSupabase;
/**
 * Deletes an image from Supabase storage by URL
 * @param imageUrl - The public URL of the image to delete
 * @param bucket - The Supabase bucket name (default: 'profile-images')
 */
const deleteImageFromSupabase = (imageUrl_1, ...args_1) => __awaiter(void 0, [imageUrl_1, ...args_1], void 0, function* (imageUrl, bucket = "profile-images") {
    try {
        // Extract the file path from the URL
        const urlParts = imageUrl.split(`${bucket}/`);
        if (urlParts.length < 2) {
            throw new Error("Invalid image URL format");
        }
        const filePath = urlParts[1];
        const { error } = yield supabaseClient_1.supabase.storage.from(bucket).remove([filePath]);
        if (error) {
            throw new Error(`Supabase delete error: ${error.message}`);
        }
    }
    catch (error) {
        console.error("Image deletion error:", error);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
});
exports.deleteImageFromSupabase = deleteImageFromSupabase;
