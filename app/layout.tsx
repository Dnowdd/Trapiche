import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/shared/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Trapiche — seu diário de leituras",
    template: "%s · Trapiche",
  },
  description:
    "Catalogue o que você lê, acompanhe seu progresso, escreva resenhas e monte listas de livros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={cn("h-full", "antialiased", "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col bg-(--yellow) text-(--ink-2) min-w-360 has-[[data-responsive]]:min-w-0 font-features-['ss01','cv11'] [text-rendering:optimizeLegibility]">
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
