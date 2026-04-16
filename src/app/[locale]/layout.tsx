import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import './globals.css';
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import AuthSessionProvider from "@/components/auth/session-provider";
import ConditionalNavbar from "@/components/layout/conditional-navbar";
import LoadingProvider from "@/components/providers/loading-provider";
import { LocaleSwitchProvider } from "@/components/providers/locale-switch-provider";


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

  // Load messages for the current locale so client components can access them
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LoadingProvider>
              <NextIntlClientProvider messages={messages}>
                <LocaleSwitchProvider>
                  <ConditionalNavbar />
                  {children}
                  <Toaster />
                </LocaleSwitchProvider>
              </NextIntlClientProvider>
            </LoadingProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
