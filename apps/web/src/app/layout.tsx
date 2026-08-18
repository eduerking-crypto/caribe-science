import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/providers";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import PublishBot from "@/components/PublishBot";
import { getServerLocale } from "@/lib/dicts";
import { API_URL } from "@/lib/api";
import type { JournalOut } from "@/lib/types";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CARIBE SCIENCE — Caribbean Scientific Publishing",
    template: "%s · CARIBE SCIENCE",
  },
  description:
    "Open scientific publishing platform from the Caribbean: rigorous peer review, open data, free access.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  let journal: JournalOut | null = null;
  try {
    const res = await fetch(`${API_URL}/journals?limit=1`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as JournalOut[];
      journal = data[0] ?? null;
    }
  } catch {
    journal = null;
  }
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${serif.variable} min-h-full flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer journal={journal} />
          <PublishBot />
        </Providers>
      </body>
    </html>
  );
}