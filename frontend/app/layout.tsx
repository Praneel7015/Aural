import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const brand = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["500", "600", "700"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Verity - Scam Call Shield",
  description:
    "Real-time trust scoring from synthetic-voice detection, scam-pattern analysis, and speaker verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("verity-theme");if(t==="light"){document.documentElement.classList.remove("dark")}else if(!t&&!window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.remove("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={cn(
          brand.variable,
          body.variable,
          mono.variable,
          "min-h-screen bg-background text-foreground antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
