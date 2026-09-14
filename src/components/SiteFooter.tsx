import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/5 py-10 text-sm text-slate-500">
      <div className="container-page flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} EduFlow — учебный проект для портфолио.</p>
        <div className="flex flex-wrap gap-5">
          <Link href="/courses" className="transition hover:text-slate-300">
            Курсы
          </Link>
          <Link href="/pricing" className="transition hover:text-slate-300">
            Подписка
          </Link>
          <Link href="/login" className="transition hover:text-slate-300">
            Вход
          </Link>
        </div>
      </div>
    </footer>
  );
}
