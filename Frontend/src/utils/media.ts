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
