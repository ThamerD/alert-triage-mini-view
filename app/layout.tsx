import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alert Triage",
  description: "SOC alert triage mini-view",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
