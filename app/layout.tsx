import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppButton } from "./components";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "The Travel Beats | Curated Journeys", template: "%s | The Travel Beats" },
  description: "Curated travel experiences with rhythm, trust, and discovery. Explore destinations, thoughtful journeys, and human-led travel planning with The Travel Beats.",
  keywords: ["Travel Beats", "luxury travel", "custom travel", "travel agency", "curated journeys"],
  icons: {
    icon: "/brand/travel-beats-monogram.png",
    shortcut: "/brand/travel-beats-monogram.png",
    apple: "/brand/travel-beats-monogram.png",
  },
  openGraph: { title: "The Travel Beats", description: "Curating seamless journeys with rhythm, trust, and discovery.", type: "website" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}