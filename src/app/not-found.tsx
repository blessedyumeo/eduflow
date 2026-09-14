import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center">
      <p className="text-6xl font-semibold text-white">404</p>
      <h1 className="mt-4 text-xl font-medium text-slate-300">Страница не найдена</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Возможно, курс сняли с публикации или ссылка устарела.
      </p>
      <Link href="/courses" className="btn-primary mt-8">
        В каталог курсов
      </Link>
    </div>
  );
}
