import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import Navbar from "@/layout/Navbar";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { DeviceWebSocketProvider } from "@/contexts/DeviceWebSocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PPC Web Portal",
  description: "A web portal for the PPC project"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <DeviceWebSocketProvider>
        <html lang="en">
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

            <div className="flex flex-col h-screen">
              <header className="">
                <Navbar />
              </header>
              <main>            
                {children}
              </main>
            </div>
            <ConnectionStatus />
          </body>
        </html>
      </DeviceWebSocketProvider>
    </ClerkProvider>
  );
}
