import type { Metadata } from "next";
import { Bagel_Fat_One, Newsreader } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const bagel = Bagel_Fat_One({ variable: "--font-bagel", weight: "400", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://www.continuousvibe.com"),
  title: { default: "Continuous Vibe — Psychedelic art by Steve Knopf", template: "%s | Continuous Vibe" },
  description:
    "Neon and blacklight acrylic paintings, art prints and stickers by Steve Knopf. Get a free print from the Open collection.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bagel.variable} ${newsreader.variable} antialiased`}>
      <body className="flex min-h-screen flex-col text-lg">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
