import type { Metadata } from "next";
import { Chakra_Petch, Russo_One } from "next/font/google";
import { LiveDataSync } from "@/components/live/live-data-sync";
import "./globals.css";

const display = Russo_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const body = Chakra_Petch({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ACCESS CPE Fair 2026",
    template: "%s · ACCESS CPE Fair 2026",
  },
  description: "ACCESS CPE Fair 2026 leaderboard. Fly high. Play as one.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <LiveDataSync />
        {children}
      </body>
    </html>
  );
}
