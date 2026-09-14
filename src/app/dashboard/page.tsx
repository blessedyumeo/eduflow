import type { Metadata } from 'next';
import Link from 'next/link';

import { hasActiveSubscription, requireUser } from '@/lib/auth';
import { coverStyle } from '@/lib/cover';
import { formatDate, formatDateTime, formatPrice, pluralize } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Мои курсы' };

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает оплаты',
  SUCCEEDED: 'Оплачен',
  CANCELED: 'Отменён',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'text-amber-300',
  SUCCEEDED: 'text-accent',
  CANCELED: 'text-slate-500',
};

export default async function DashboardPage() {
  const user = await requireUser();
  const pro = hasActiveSubscription(user);

  const [enrollments, proCourses, progress, orders] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { course: { include: { lessons: { select: { id: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    // При активной подписке в кабинет попадают все опубликованные курсы.
    prisma.course.findMany({
      where: pro ? { published: true } : { id: '__none__' },
      include: { lessons: { select: { id: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: user.id, completed: true },
      select: { lessonId: true },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const completed = new Set(progress.map((p) => p.lessonId));

  const map = new Map<
    string,
    { slug: string; title: string; cover: string; lessons: { id: string }[] }
  >();
  for (const item of enrollments) map.set(item.course.id, item.course);
  for (const course of proCourses) if (!map.has(course.id)) map.set(course.id, course);

  const myCourses = [...map.values()].map((course) => {
    const total = course.lessons.length;
    const done = course.lessons.filter((l) => completed.has(l.id)).length;
    return {
      slug: course.slug,
      title: course.title,
      cover: course.cover,
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  });

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Привет, {user.name}
          </h1>
          <p className="mt-2 text-slate-400">
            {pro && user.subscriptionUntil
              ? `Подписка активна до ${formatDate(user.subscriptionUntil)} — открыты все курсы.`
              : 'Здесь собраны ваши курсы и история платежей.'}
          </p>
        </div>
        {!pro && (
          <Link href="/pricing" className="btn-ghost">
            Открыть подписку
          </Link>
        )}
      </div>

      <h2 className="mt-12 text-xl font-semibold text-white">Мои курсы</h2>

      {myCourses.length === 0 ? (
        <div className="card mt-4 p-10 text-center">
          <p className="text-slate-400">Вы пока не купили ни одного курса.</p>
          <Link href="/courses" className="btn-primary mt-5">
            Выбрать курс
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {myCourses.map((course) => (
            <Link
              key={course.slug}
              href={`/learn/${course.slug}`}
              className="card p-5 transition hover:border-brand-400/30"
            >
              <div className="flex items-start gap-4">
                <div
                  className="h-12 w-20 shrink-0 rounded-lg border border-white/10"
                  style={coverStyle(course.cover)}
                  aria-hidden
                />
                <h3 className="flex-1 text-base font-semibold text-white">{course.title}</h3>
                <span className="text-sm font-medium text-brand-200">{course.percent}%</span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent"
                  style={{ width: `${course.percent}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {course.done} из {course.total}{' '}
                {pluralize(course.total, 'урока', 'уроков', 'уроков')} пройдено
              </p>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-12 text-xl font-semibold text-white">История платежей</h2>

      <div className="card mt-4 overflow-x-auto">
        <table className="table-base min-w-[640px]">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Позиция</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                <td>
                  {order.type === 'SUBSCRIPTION'
                    ? `Подписка, ${order.months} мес.`
                    : (order.course?.title ?? 'Курс удалён')}
                </td>
                <td className="whitespace-nowrap">{formatPrice(order.amount)}</td>
                <td className={STATUS_CLASS[order.status]}>{STATUS_LABEL[order.status]}</td>
                <td className="text-right">
                  {order.status === 'PENDING' && (
                    <Link
                      href={`/checkout/${order.id}`}
                      className="text-sm text-brand-300 hover:text-brand-100"
                    >
                      Оплатить
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Платежей пока не было.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
