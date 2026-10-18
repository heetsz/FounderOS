import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FounderOS — Persistent Memory Multi-Agent Founder Workspace",
  description: "Track 2: Agent Memory and Coordination for FalkorDB Graph Hacks. Multi-agent team with episodic, semantic, and procedural graph memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-appBg text-appText min-h-screen">
        {children}
      </body>
    </html>
  );
}
