import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DiabetesAI — Intelligent Risk Prediction",
  description:
    "State-of-the-art diabetes risk prediction powered by ensemble machine learning models with SHAP explainability. Get instant, accurate risk assessment.",
  keywords: ["diabetes", "risk prediction", "AI", "machine learning", "health", "SHAP"],
  openGraph: {
    title: "DiabetesAI — Intelligent Risk Prediction",
    description: "AI-powered diabetes risk assessment with explainable results.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <I18nProvider>
            <ThemeProvider>
              <Navbar />
              <main>{children}</main>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "0.875rem",
                  },
                }}
              />
            </ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
