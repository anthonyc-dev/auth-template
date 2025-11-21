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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = exports.uploadImageToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const stream_1 = require("stream");
/**
 * Uploads an image file to Cloudinary
 * @param file - The file buffer from multer
 * @param folder - The Cloudinary folder name (default: 'profile-images')
 * @returns The secure URL of the uploaded image
 */
const uploadImageToCloudinary = (file_1, ...args_1) => __awaiter(void 0, [file_1, ...args_1], void 0, function* (file, folder = "profile-images") {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder: folder,
            resource_type: "image",
            transformation: [
                { width: 500, height: 500, crop: "limit" },
                { quality: "auto" },
            ],
        }, (error, result) => {
            if (error) {
                reject(new Error(`Cloudinary upload error: ${error.message}`));
            }
            else if (result) {
                resolve(result.secure_url);
            }
            else {
                reject(new Error("Upload failed with no result"));
            }
        });
        // Convert buffer to stream and pipe to Cloudinary
        const bufferStream = stream_1.Readable.from(file.buffer);
        bufferStream.pipe(uploadStream);
    });
});
exports.uploadImageToCloudinary = uploadImageToCloudinary;
/**
 * Deletes an image from Cloudinary by URL
 * @param imageUrl - The public URL of the image to delete
 */
const deleteImageFromCloudinary = (imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract public_id from URL
        const urlParts = imageUrl.split("/");
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = fileWithExt.split(".")[0];
        const folder = urlParts[urlParts.length - 2];
        const fullPublicId = `${folder}/${publicId}`;
        yield cloudinary_1.default.uploader.destroy(fullPublicId);
    }
    catch (error) {
        console.error("Image deletion error:", error);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
});
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
