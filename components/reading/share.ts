import { toast } from "@/components/shared/toast";

export async function shareLink(path: string, title: string) {
  const url = new URL(path, window.location.origin).toString();
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copiado.");
  } catch {
    toast(url);
  }
}
