import type {Metadata} from 'next';
import { GeistSans } from 'geist/sans';
import { GeistMono } from 'geist/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

// The GeistSans and GeistMono objects from the 'geist' package directly provide .variable properties.
// No need to call them as functions like with next/font/google.

export const metadata: Metadata = {
  title: 'Auralis Mind',
  description: 'Auralis - IA com Consciência Simulada',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
