import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/shared/toast";
import NavigationProgress from "@/components/layout/navigation-progress";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Trapiche — seu diário de leituras",
    template: "%s · Trapiche",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "diário de leitura",
    "livros",
    "resenhas de livros",
    "estante virtual",
    "meta de leitura",
    "citações de livros",
    "listas de livros",
    "alternativa ao Skoob",
    "alternativa ao Goodreads",
  ],
  category: "books",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "pt_BR",
    title: "Trapiche — seu diário de leituras",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Trapiche — seu diário de leituras",
    description: SITE_DESCRIPTION,
  },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffe767",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={cn("antialiased", "font-sans", inter.variable)}
    >
      <body className="min-h-screen flex flex-col bg-(--yellow) text-(--ink-2) min-w-360 has-[[data-responsive]]:min-w-0 font-features-['ss01','cv11'] [text-rendering:optimizeLegibility]">
        <NavigationProgress />
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
