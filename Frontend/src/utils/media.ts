/**
 * Resolves static media URLs (like /static/uploads/...) to fully qualified URLs
 * pointing to the backend API origin if relative.
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const origin = baseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${path}`;
};

export type UploadKind = "avatar" | "attachment";

const UPLOAD_PRESETS: Record<UploadKind, { maxEdge: number; quality: number }> = {
  avatar: { maxEdge: 640, quality: 0.85 },
  attachment: { maxEdge: 1600, quality: 0.9 },
};

/**
 * Client-side image compression before upload. Keeps requests well under
 * Vercel's body limit and makes the base64 response small; PDFs and GIFs
 * pass through untouched, and any failure falls back to the original file
 * (the backend re-validates and re-optimises either way).
 */
export const compressImageForUpload = async (
  file: File,
  kind: UploadKind
): Promise<File> => {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { maxEdge, quality } = UPLOAD_PRESETS[kind];
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Flatten transparency — JPEG has no alpha channel.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;
    const base = file.name.replace(/\.\w+$/, "") || "upload";
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
};
