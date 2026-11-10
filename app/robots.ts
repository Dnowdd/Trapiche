import type { MetadataRoute } from "next";

const TRAINING_CRAWLERS = [
  "ClaudeBot",
  "anthropic-ai",
  "GPTBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "meta-externalagent",
  "FacebookBot",
  "cohere-ai",
  "cohere-training-data-crawler",
  "Diffbot",
  "omgili",
  "Timpibot",
  "ImagesiftBot",
];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: TRAINING_CRAWLERS, disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/profile",
          "/admin",
          "/suporte",
          "/notificacoes",
          "/desenvolvedores",
          "/importar",
          "/auth",
          "/*?visitante=",
          "/search?",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
