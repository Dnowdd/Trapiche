export function sharpCover(url: string, zoom?: number): string {
  let parsed: URL;
  try {
    parsed = new URL(url.replace(/^http:/, "https:"));
  } catch {
    return url;
  }
  if (parsed.hostname !== "books.google.com") return url;
  parsed.searchParams.delete("edge");
  if (zoom && parsed.pathname.includes("/publisher/content"))
    parsed.searchParams.set("zoom", String(zoom));
  return parsed.toString();
}
