import Link from 'next/link';
import { notFound } from 'next/navigation';

import { grantAccessAction, revokeAccessAction } from '@/actions/admin';
import { SubmitButton } from '@/components/SubmitButton';
import { formatDate, formatDateTime, formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserPage({ params }: Props) {
  const { id } = await params;

  const [user, allCourses] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: { include: { course: { select: { id: true, title: true } } } },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { course: { select: { title: true } } },
        },
      },
    }),
    prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ]);

  if (!user) notFound();

  const ownedIds = new Set(user.enrollments.map((e) => e.courseId));
  const available = allCourses.filter((c) => !ownedIds.has(c.id));
  const pro = user.subscriptionUntil && user.subscriptionUntil.getTime() > Date.now();

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-300">
        ← Все пользователи
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-white">{user.name}</h1>
      <p className="mt-1 text-sm text-slate-400">{user.email}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Роль', value: user.role === 'ADMIN' ? 'Администратор' : 'Студент' },
          { label: 'Регистрация', value: formatDate(user.createdAt) },
          {
            label: 'Подписка',
            value: pro ? `активна до ${formatDate(user.subscriptionUntil)}` : 'нет',
          },
        ].map((item) => (
          <div key={item.label} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="card mt-8 p-6">
        <h2 className="text-base font-semibold text-white">Доступ к курсам</h2>

        <ul className="mt-4 divide-y divide-white/5">
          {user.enrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <span className="text-slate-200">{enrollment.course.title}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {enrollment.source === 'PURCHASE'
                    ? 'покупка'
                    : enrollment.source === 'SUBSCRIPTION'
                      ? 'подписка'
                      : 'выдан вручную'}
                </span>
                <form action={revokeAccessAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="courseId" value={enrollment.courseId} />
                  <SubmitButton className="btn-ghost px-3 py-1.5 text-xs">Забрать</SubmitButton>
                </form>
              </div>
            </li>
          ))}
          {user.enrollments.length === 0 && (
            <li className="py-4 text-sm text-slate-500">Доступов нет</li>
          )}
        </ul>

        {available.length > 0 && (
          <form action={grantAccessAction} className="mt-5 flex flex-wrap gap-2">
            <input type="hidden" name="userId" value={user.id} />
            <select name="courseId" className="input max-w-xs">
              {available.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <SubmitButton pendingText="Выдаём…">Выдать доступ</SubmitButton>
          </form>
        )}
      </section>

      <section className="card mt-8 overflow-x-auto">
        <p className="border-b border-white/5 px-5 py-4 text-sm font-semibold text-white">
          Заказы
        </p>
        <table className="table-base min-w-[560px]">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Позиция</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {user.orders.map((order) => (
              <tr key={order.id}>
                <td className="whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                <td>
                  {order.type === 'SUBSCRIPTION'
                    ? `Подписка ${order.months} мес.`
                    : (order.course?.title ?? '—')}
                </td>
                <td className="whitespace-nowrap">{formatPrice(order.amount)}</td>
                <td>{order.status}</td>
              </tr>
            ))}
            {user.orders.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Заказов нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
