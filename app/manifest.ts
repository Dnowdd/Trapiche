import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trapiche — seu diário de leituras",
    short_name: "Trapiche",
    description: SITE_DESCRIPTION,
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8d5",
    theme_color: "#ffe767",
    categories: ["books", "education", "lifestyle"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Buscar livros", url: "/search" },
      { name: "Importar estante", url: "/importar" },
    ],
  };
}
