import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pocket Parcel — Send a little brightness",
  description: "Pack a free digital care parcel and share it with someone you love.",
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
