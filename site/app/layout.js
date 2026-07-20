import { Geist, Geist_Mono } from "next/font/google";
import ChatTuma from "@/components/ChatTuma";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tuma Emprego — Perfil",
  description: "Hub local de candidaturas — perfil, CV e vagas",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-100 text-zinc-900">
        <SiteHeader />
        {children}
        <ChatTuma />
      </body>
    </html>
  );
}
