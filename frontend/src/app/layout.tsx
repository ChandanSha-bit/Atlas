import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Atlas - AI-Driven SaaS Platform",
  description: "Atlas is a refined creative partner, bridging the gap between human intuition and unyielding neural performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("Atlas-theme");var d=t==="dark";if(t==="system"){d=window.matchMedia("(prefers-color-scheme: dark)").matches}if(d)document.documentElement.classList.add("dark")}catch(e){}})();`
        }} />
      </head>
      <body className={`${manrope.variable} ${newsreader.variable} bg-background text-on-surface antialiased font-body-md overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col relative`}>
        {children}
      </body>
    </html>
  );
}
