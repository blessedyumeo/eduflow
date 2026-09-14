import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { fulfillOrder } from '@/lib/orders';
import { fetchPayment } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Notification = {
  type?: string;
  event?: string;
  object?: {
    id?: string;
    status?: string;
    metadata?: Record<string, string>;
  };
};

/**
 * Вебхук ЮKassa. Адрес нужно указать в личном кабинете магазина:
 *   https://<домен>/api/payments/webhook
 * События: payment.succeeded, payment.canceled.
 *
 * Тело уведомления не подписывается, поэтому статус платежа мы перепроверяем
 * запросом к API ЮKassa — так подделать уведомление не получится.
 */
export async function POST(request: Request) {
  let body: Notification;
  try {
    body = (await request.json()) as Notification;
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const paymentId = body.object?.id;
  const orderId = body.object?.metadata?.orderId;

  if (!paymentId || !orderId) {
    return NextResponse.json({ error: 'no payment id' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentId !== paymentId) {
    // Отвечаем 200, чтобы ЮKassa не ретраила бесконечно неизвестное уведомление.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const remote = await fetchPayment(paymentId);
  const status = remote?.status ?? body.object?.status;

  if (status === 'succeeded') {
    await fulfillOrder(orderId);
  } else if (status === 'canceled') {
    await prisma.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'CANCELED' },
    });
  }

  return NextResponse.json({ ok: true });
}
