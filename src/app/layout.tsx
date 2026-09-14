import type { Metadata } from 'next';

import './globals.css';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: {
    default: 'EduFlow — платформа онлайн-курсов',
    template: '%s · EduFlow',
  },
  description:
    'Платформа онлайн-курсов: каталог, личный кабинет с прогрессом, оплата через ЮKassa и админка.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
