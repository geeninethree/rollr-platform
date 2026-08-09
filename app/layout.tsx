import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { DemoBanner } from "@/components/layout/demo-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://rollr-platform.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ROLLR — Mumbai photographers & editors",
    template: "%s · ROLLR",
  },
  description:
    "Book Mumbai photographers and editors with 0% commission. Creators list for ₹299/mo — unlimited briefs.",
  applicationName: "ROLLR",
  keywords: [
    "Mumbai photographer",
    "Mumbai videographer",
    "wedding photographer Mumbai",
    "video editor Mumbai",
    "zero commission",
    "ROLLR",
  ],
  authors: [{ name: "ROLLR" }],
  openGraph: {
    title: "ROLLR — Mumbai visual creators",
    description:
      "Zero commission. Direct after accept. List for ₹299/mo.",
    locale: "en_IN",
    type: "website",
    siteName: "ROLLR",
    url: siteUrl,
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "ROLLR — Mumbai photographers & editors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ROLLR — Mumbai visual creators",
    description:
      "Zero-commission directory for Mumbai shooters and editors.",
    images: ["/og.svg"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-noise flex min-h-screen flex-col bg-background font-sans text-foreground antialiased`}
      >
        <DemoBanner />
        <Navbar />
        <main className="relative z-0 flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
