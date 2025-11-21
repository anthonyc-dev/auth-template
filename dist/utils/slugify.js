"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
// utils/slugify.ts
function slugify(s) {
    return s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
