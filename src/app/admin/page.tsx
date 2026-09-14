import Link from 'next/link';

import { formatDateTime, formatPrice } from '@/lib/format';
import { paymentMode } from '@/lib/payments';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Админка' };

export default async function AdminDashboardPage() {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [users, courses, published, revenue, revenueMonth, pending, lastOrders, topCourses] =
    await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.course.count({ where: { published: true } }),
      prisma.order.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
      prisma.order.aggregate({
        where: { status: 'SUCCEEDED', paidAt: { gte: monthAgo } },
        _sum: { amount: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { email: true, name: true } },
          course: { select: { title: true } },
        },
      }),
      prisma.course.findMany({
        take: 5,
        orderBy: { enrollments: { _count: 'desc' } },
        select: { id: true, title: true, _count: { select: { enrollments: true } } },
      }),
    ]);

  const stats = [
    { label: 'Пользователей', value: users },
    { label: 'Курсов (опубликовано)', value: `${courses} (${published})` },
    { label: 'Выручка всего', value: formatPrice(revenue._sum.amount ?? 0) },
    { label: 'Выручка за 30 дней', value: formatPrice(revenueMonth._sum.amount ?? 0) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Обзор</h1>
        <span className="badge">
          Режим оплаты: {paymentMode() === 'mock' ? 'демо (mock)' : 'ЮKassa'}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {pending > 0 && (
        <div className="card mt-4 border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
          {pending} заказ(ов) ожидают оплаты —{' '}
          <Link href="/admin/orders?status=PENDING" className="underline">
            посмотреть
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card overflow-x-auto">
          <p className="border-b border-white/5 px-5 py-4 text-sm font-semibold text-white">
            Последние заказы
          </p>
          <table className="table-base min-w-[520px]">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Клиент</th>
                <th>Позиция</th>
                <th>Сумма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {lastOrders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                  <td>{order.user.email}</td>
                  <td>
                    {order.type === 'SUBSCRIPTION'
                      ? `Подписка ${order.months} мес.`
                      : (order.course?.title ?? '—')}
                  </td>
                  <td className="whitespace-nowrap">{formatPrice(order.amount)}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
              {lastOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Заказов пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <p className="border-b border-white/5 px-5 py-4 text-sm font-semibold text-white">
            Популярные курсы
          </p>
          <ul className="divide-y divide-white/5">
            {topCourses.map((course) => (
              <li key={course.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="text-sm text-slate-300 hover:text-white"
                >
                  {course.title}
                </Link>
                <span className="text-sm text-slate-500">{course._count.enrollments}</span>
              </li>
            ))}
            {topCourses.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-slate-500">Курсов нет</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
