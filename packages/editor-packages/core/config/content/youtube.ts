/** Normalize watch / share URLs to embed URL */
export function toYouTubeEmbedUrl(input: string): string {
  const t = input.trim();
  if (!t) return "";
  try {
    const u = new URL(t, "https://www.youtube.com");
    if (u.hostname === "youtu.be" || u.hostname.endsWith(".youtu.be")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    if (u.pathname.includes("/embed/")) return u.href;
    if (u.pathname.includes("/shorts/")) {
      const id = u.pathname.split("/shorts/")[1]?.split("/")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    /* ignore */
  }
  if (t.includes("youtube.com/embed")) return t;
  return t;
}
