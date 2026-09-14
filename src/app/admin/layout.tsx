import Link from 'next/link';

import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Обзор' },
  { href: '/admin/courses', label: 'Курсы' },
  { href: '/admin/users', label: 'Пользователи' },
  { href: '/admin/orders', label: 'Заказы' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Админка
          </p>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
