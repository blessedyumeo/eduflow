import { notFound, redirect } from 'next/navigation';

import { mockCancelAction, mockPayAction } from '@/actions/checkout';
import { SubmitButton } from '@/components/SubmitButton';
import { requireUser } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Оплата' };

type Props = { params: Promise<{ orderId: string }> };

export default async function CheckoutPage({ params }: Props) {
  const user = await requireUser();
  const { orderId } = await params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { course: { select: { title: true } } },
  });

  if (!order) notFound();
  if (order.status !== 'PENDING') redirect(`/checkout/${order.id}/return`);

  // Реальный платёж живёт на стороне ЮKassa — просто отправляем туда.
  if (order.provider === 'yookassa' && order.confirmationUrl) {
    redirect(order.confirmationUrl);
  }

  const title =
    order.type === 'SUBSCRIPTION'
      ? `Подписка EduFlow, ${order.months} мес.`
      : (order.course?.title ?? 'Курс');

  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <span className="badge">Демо-режим оплаты</span>
        <h1 className="mt-4 text-2xl font-semibold text-white">Подтверждение платежа</h1>
        <p className="mt-2 text-sm text-slate-400">
          Это встроенная эмуляция платёжной страницы. В боевом режиме
          (<code className="text-slate-300">PAYMENT_MODE=yookassa</code>) здесь открывается форма
          ЮKassa.
        </p>

        <dl className="mt-7 space-y-3 border-y border-white/5 py-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Заказ</dt>
            <dd className="text-right text-slate-200">{title}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Номер</dt>
            <dd className="text-right font-mono text-xs text-slate-400">{order.id}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">К оплате</dt>
            <dd className="text-right text-lg font-semibold text-white">
              {formatPrice(order.amount)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 space-y-2.5">
          <form action={mockPayAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <SubmitButton className="btn-primary w-full" pendingText="Проводим платёж…">
              Оплатить {formatPrice(order.amount)}
            </SubmitButton>
          </form>

          <form action={mockCancelAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <SubmitButton className="btn-ghost w-full" pendingText="Отменяем…">
              Отменить платёж
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
