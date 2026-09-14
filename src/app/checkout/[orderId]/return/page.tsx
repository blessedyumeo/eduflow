import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { fulfillOrder } from '@/lib/orders';
import { fetchPayment } from '@/lib/payments';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Результат оплаты' };

type Props = { params: Promise<{ orderId: string }> };

export default async function CheckoutReturnPage({ params }: Props) {
  const user = await requireUser();
  const { orderId } = await params;

  let order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { course: { select: { title: true, slug: true } } },
  });

  if (!order) notFound();

  // Вебхук мог ещё не прийти — на всякий случай спрашиваем статус у ЮKassa напрямую.
  if (order.status === 'PENDING' && order.provider === 'yookassa' && order.paymentId) {
    const remote = await fetchPayment(order.paymentId);
    if (remote?.status === 'succeeded') {
      await fulfillOrder(order.id);
    } else if (remote?.status === 'canceled') {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELED' } });
    }
    order = await prisma.order.findFirst({
      where: { id: order.id },
      include: { course: { select: { title: true, slug: true } } },
    });
    if (!order) notFound();
  }

  const succeeded = order.status === 'SUCCEEDED';
  const canceled = order.status === 'CANCELED';

  return (
    <div className="container-page flex justify-center py-20">
      <div className="card w-full max-w-md p-8 text-center">
        <div
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl ${
            succeeded
              ? 'bg-accent/15 text-accent'
              : canceled
                ? 'bg-red-500/15 text-red-300'
                : 'bg-amber-500/15 text-amber-300'
          }`}
        >
          {succeeded ? '✓' : canceled ? '✕' : '…'}
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-white">
          {succeeded ? 'Оплата прошла' : canceled ? 'Платёж отменён' : 'Платёж в обработке'}
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          {succeeded
            ? order.type === 'SUBSCRIPTION'
              ? `Подписка на ${order.months} мес. активирована — все курсы открыты.`
              : 'Доступ к курсу открыт. Приятной учёбы!'
            : canceled
              ? 'Деньги не списаны. Можно оформить заказ заново в любой момент.'
              : 'Банк ещё подтверждает платёж. Обновите страницу через пару минут.'}
        </p>

        <p className="mt-4 text-sm text-slate-500">
          Сумма: {formatPrice(order.amount)}
        </p>

        <div className="mt-7 space-y-2.5">
          {succeeded && order.type === 'COURSE' && order.course && (
            <Link href={`/learn/${order.course.slug}`} className="btn-primary w-full">
              Начать обучение
            </Link>
          )}
          <Link href="/dashboard" className="btn-ghost w-full">
            В личный кабинет
          </Link>
          {canceled && (
            <Link href="/courses" className="btn-ghost w-full">
              Вернуться в каталог
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
