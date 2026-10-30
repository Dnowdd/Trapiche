export const authorHref = (name: string) =>
  `/author/${encodeURIComponent(name)}`;

export const publisherHref = (name: string) =>
  `/publisher/${encodeURIComponent(name)}`;

export function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/\\") || value.startsWith("/auth")) return null;
  return value;
}

export function loginHref(next?: string, mode?: "register") {
  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  const target =
    next ??
    (typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : null);
  if (safeNext(target)) params.set("next", target!);
  const qs = params.toString();
  return `/auth${qs ? `?${qs}` : ""}`;
}
