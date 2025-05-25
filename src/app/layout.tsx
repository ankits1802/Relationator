
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import { cn } from '@/lib/utils';
import { DisplayModeProvider } from '@/contexts/DisplayModeContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Relationator',
  description: 'Functional Dependency & Relational Algebra Calculator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, "antialiased font-sans")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DisplayModeProvider>
            <SidebarProvider defaultOpen={true}>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <SidebarInset className="flex flex-col flex-1 bg-muted/30">
                  <AppHeader />
                  <main className="flex-1 w-full max-w-full p-4 overflow-y-auto">
                    {children}
                  </main>
                  <AppFooter />
                </SidebarInset>
              </div>
              <Toaster />
            </SidebarProvider>
          </DisplayModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
