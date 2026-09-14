import Link from 'next/link';

import { logoutAction } from '@/actions/auth';
import { getCurrentUser, hasActiveSubscription } from '@/lib/auth';

export async function SiteHeader() {
  const user = await getCurrentUser();
  const pro = hasActiveSubscription(user);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-accent text-sm font-bold text-ink-950">
            EF
          </span>
          <span className="text-base font-semibold tracking-tight text-white">EduFlow</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link href="/courses" className="transition hover:text-white">
            Курсы
          </Link>
          <Link href="/pricing" className="transition hover:text-white">
            Подписка
          </Link>
          {user && (
            <Link href="/dashboard" className="transition hover:text-white">
              Мои курсы
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="text-brand-300 transition hover:text-brand-100">
              Админка
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {pro && <span className="badge hidden sm:inline-flex">PRO</span>}
              <Link
                href="/dashboard"
                className="hidden text-sm text-slate-300 transition hover:text-white sm:block"
              >
                {user.name}
              </Link>
              <form action={logoutAction}>
                <button className="btn-ghost px-3 py-2 text-xs" type="submit">
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-3 py-2 text-xs">
                Войти
              </Link>
              <Link href="/register" className="btn-primary px-3 py-2 text-xs">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
