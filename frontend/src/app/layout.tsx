import type { Metadata } from "next";
import { Syne, DM_Mono } from 'next/font/google';
import "./globals.css";
import { WalletProvider } from '@/context/WalletContext';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Algorand Prediction Market",
  description: "Decentralized prediction markets powered by Algorand blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-gray-50">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
