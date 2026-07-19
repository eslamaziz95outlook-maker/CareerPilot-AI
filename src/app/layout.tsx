import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerPilot AI — Verified career intelligence",
  description: "A bilingual, document-backed career profile and job matching experience.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
