import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Oleo_Script, Roboto_Mono } from "next/font/google";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque",
  weight: ["800"],
  display: "swap",
});

const oleoScript = Oleo_Script({
  subsets: ["latin"],
  variable: "--font-oleo-script",
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  weight: ["400", "500"],
  display: "swap",
});

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
  themeColor: "#fcfaf5",
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
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${oleoScript.variable} ${inter.variable} ${robotoMono.variable}`}
    >
      <body className="bg-[#fcfaf5] text-[#1a3300] font-sans antialiased selection:bg-[#ffe95c] selection:text-[#1a3300]">
        {children}
      </body>
    </html>
  );
}
