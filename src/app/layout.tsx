import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "Stage Dash",
  description: "The fastest way to lookup anything Sonic Adventure 2 related.. making you dash from stage to stage.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-20 flex justify-center py-4">
              <nav className="glass px-4 py-2">
                <ul className="flex items-center gap-2 text-sm">
                  <li><button className="px-3 py-1 rounded-md hover:bg-white/10">All</button></li>
                  <li><button className="px-3 py-1 rounded-md hover:bg-white/10">Character</button></li>
                  <li><button className="px-3 py-1 rounded-md hover:bg-white/10">Item</button></li>
                  <li><button className="px-3 py-1 rounded-md hover:bg-white/10">Stage</button></li>
                </ul>
              </nav>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
