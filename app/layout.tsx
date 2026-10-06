import type { Metadata, Viewport } from "next";
import { Playfair_Display, Jost } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Manna Cookies & Co. · Straight From Heaven",
  description:
    "One really good cookie, baked fresh each week. Small batch, pickup only. Order this week's Manna.",
  openGraph: {
    title: "Manna Cookies & Co.",
    description: "One really good cookie, baked fresh each week.",
    images: ["/cookie-stack.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b0f09",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${jost.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
