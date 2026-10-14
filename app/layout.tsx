import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay — your personal call assistant",
  description: "A calmer way to keep up with every call.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
