import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { SearchProvider } from "./_components/search/SearchContext";
import SearchBar from "./_components/search/SearchBar";

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
          <SearchProvider>
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-20 flex justify-center py-4">
                <nav className="glass px-4 py-2 flex items-center justify-center">
                  <SearchBar />
                </nav>
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </SearchProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
