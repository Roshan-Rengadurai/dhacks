import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const firaCode = Fira_Code({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const firaSans = Fira_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EnergyIQ — Stop wasting energy",
  description:
    "Map your business to real EPA emission data, see where energy goes, and get a plan to cut costs and carbon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${firaCode.variable} ${firaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-background text-foreground">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
