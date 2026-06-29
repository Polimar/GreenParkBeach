import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/PwaRegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Green Park Beach — Gestione Ombrelloni",
  description: "Sistema di gestione intelligente per l'assegnazione degli ombrelloni alle camere",
  applicationName: "Green Park Beach",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/apple-touch-icon-167.png", sizes: "167x167", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GP Beach",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#166534",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
