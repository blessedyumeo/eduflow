import Link from 'next/link';

import { cancelOrderAction, markOrderPaidAction } from '@/actions/admin';
import { SubmitButton } from '@/components/SubmitButton';
import { formatDateTime, formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Заказы · Админка' };

const FILTERS = [
  { value: '', label: 'Все' },
  { value: 'PENDING', label: 'Ожидают' },
  { value: 'SUCCEEDED', label: 'Оплачены' },
  { value: 'CANCELED', label: 'Отменены' },
];

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const valid = ['PENDING', 'SUCCEEDED', 'CANCELED'].includes(status ?? '')
    ? (status as 'PENDING' | 'SUCCEEDED' | 'CANCELED')
    : undefined;

  const [orders, totals] = await Promise.all([
    prisma.order.findMany({
      where: valid ? { status: valid } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.order.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Заказы</h1>
        <span className="badge">Оплачено всего: {formatPrice(totals._sum.amount ?? 0)}</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = (status ?? '') === filter.value;
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/admin/orders?status=${filter.value}` : '/admin/orders'}
              className={`rounded-lg px-3 py-1.5 text-xs transition ${
                active
                  ? 'bg-brand-500 text-white'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="card mt-5 overflow-x-auto">
        <table className="table-base min-w-[840px]">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Клиент</th>
              <th>Позиция</th>
              <th>Сумма</th>
              <th>Провайдер</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                <td>
                  <Link
                    href={`/admin/users/${order.user.id}`}
                    className="text-slate-200 hover:text-white"
                  >
                    {order.user.name}
                  </Link>
                  <p className="text-xs text-slate-500">{order.user.email}</p>
                </td>
                <td>
                  {order.type === 'SUBSCRIPTION'
                    ? `Подписка ${order.months} мес.`
                    : (order.course?.title ?? '—')}
                </td>
                <td className="whitespace-nowrap">{formatPrice(order.amount)}</td>
                <td className="text-xs text-slate-500">{order.provider}</td>
                <td
                  className={
                    order.status === 'SUCCEEDED'
                      ? 'text-accent'
                      : order.status === 'PENDING'
                        ? 'text-amber-300'
                        : 'text-slate-500'
                  }
                >
                  {order.status}
                </td>
                <td className="text-right">
                  {order.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <form action={markOrderPaidAction}>
                        <input type="hidden" name="id" value={order.id} />
                        <SubmitButton className="btn-ghost px-3 py-1.5 text-xs">
                          Отметить оплаченным
                        </SubmitButton>
                      </form>
                      <form action={cancelOrderAction}>
                        <input type="hidden" name="id" value={order.id} />
                        <SubmitButton className="btn-danger px-3 py-1.5 text-xs">
                          Отменить
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  Заказов нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
