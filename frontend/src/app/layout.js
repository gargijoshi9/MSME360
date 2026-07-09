import "./globals.css";
import { Geist, Unbounded } from "next/font/google";

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
      <head>
        {/* Your inline blocker script is perfect—it stops screen flashing completely */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('msme360_theme') === 'dark' || (!('msme360_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}