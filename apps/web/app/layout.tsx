import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Talent Marketplace",
    template: "%s | AI Talent Marketplace"
  },
  description:
    "AI-powered recruiter, admin, and talent workflow platform spanning web, mobile, GraphQL API, and FastAPI matching services.",
  applicationName: "AI Talent Marketplace",
  keywords: [
    "AI talent marketplace",
    "recruiting platform",
    "talent matching",
    "GraphQL",
    "Next.js",
    "Expo"
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
