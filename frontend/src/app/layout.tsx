import type { Metadata } from "next";
import { Noto_Sans_JP, DotGothic16 } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navbar";
import { Toaster } from "react-hot-toast";


const notoTabsJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "家計簿アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoTabsJP.className} ${dotGothic.variable} bg-yellow-50`}>
        <Navigation />
        <Toaster position="top-center" />

        <main className="md:ml-64 pd-20 min-h-screen">
          <div className="container mx-auto p-4 max-w-4xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}