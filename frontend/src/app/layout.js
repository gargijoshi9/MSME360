import "./globals.css";
import { Geist, Unbounded } from "next/font/google";
import ThemeInitializer from "./ThemeInitializer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700"],
});

export const metadata = {
  title: "MSME360 — Bring Order to Your Business Chaos",
  description: "Unified Smart Inbox, AI classification, GST Invoicing, and Supplier Marketplace for MSMEs.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${unbounded.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}