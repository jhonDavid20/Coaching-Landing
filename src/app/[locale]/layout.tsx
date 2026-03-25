import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import './globals.css';
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import AuthSessionProvider from "@/components/auth/session-provider";
import ConditionalNavbar from "@/components/layout/conditional-navbar";
import LoadingProvider from "@/components/providers/loading-provider";


export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
 
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LoadingProvider>
              <NextIntlClientProvider>
                <ConditionalNavbar />
                {children}
                <Toaster />
              </NextIntlClientProvider>
            </LoadingProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
