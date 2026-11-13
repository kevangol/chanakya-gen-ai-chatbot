import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ variable: "--font-ui", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-prose", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-code", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chanakya",
  description: "Ask questions grounded in your documents",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
