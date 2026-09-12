import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Maya", template: "%s | Maya" },
  description: "Organiza tus metas, hábitos y bienestar con intención.",
};
export const viewport: Viewport = { themeColor: "#f7f5ef" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={cn(
        "h-full antialiased",
        manrope.variable,
        newsreader.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
