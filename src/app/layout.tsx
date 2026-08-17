import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/press-start-2p";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Maveli Files",
  description:
    "Maveli has disappeared. Track the sightings, follow the trail, and join the rescue.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/maveli-logo.png",
    apple: "/maveli-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#070907",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
