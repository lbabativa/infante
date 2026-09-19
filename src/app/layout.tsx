import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk, DM_Mono } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-bodoni" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });
const dmmono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dmmono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Infante Hair Stylist — Tu esencia, nuestro arte", template: "%s · Infante Hair Stylist" },
  description:
    "Salón de alta peluquería en Bogotá. Color, balayage, cortes de autor, tratamientos Kérastase, Wella y Alfaparf, maquillaje y novias. Agenda tu cita en línea.",
  openGraph: { locale: "es_CO", type: "website", siteName: "Infante Hair Stylist" },
};

export const viewport: Viewport = { themeColor: "#0c0b0a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${bodoni.variable} ${hanken.variable} ${dmmono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
