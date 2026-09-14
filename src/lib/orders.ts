import 'server-only';

import { prisma } from '@/lib/prisma';

/**
 * Выдаёт доступ по оплаченному заказу. Идемпотентна: повторный вызов
 * (например, ретрай вебхука ЮKassa) ничего не ломает.
 */
export async function fulfillOrder(orderId: string): Promise<'ok' | 'already' | 'not_found'> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return 'not_found';
  if (order.status === 'SUCCEEDED') return 'already';

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'SUCCEEDED', paidAt: new Date() },
    });

    if (order.type === 'COURSE' && order.courseId) {
      await tx.enrollment.upsert({
        where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
        create: { userId: order.userId, courseId: order.courseId, source: 'PURCHASE' },
        update: {},
      });
    }

    if (order.type === 'SUBSCRIPTION') {
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { subscriptionUntil: true },
      });
      const base =
        user?.subscriptionUntil && user.subscriptionUntil > new Date()
          ? new Date(user.subscriptionUntil)
          : new Date();
      base.setMonth(base.getMonth() + Math.max(1, order.months));
      await tx.user.update({
        where: { id: order.userId },
        data: { subscriptionUntil: base },
      });
    }
  });

  return 'ok';
}

export async function cancelOrder(orderId: string) {
  await prisma.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'CANCELED' },
  });
}

/** Есть ли у пользователя доступ к курсу: покупка, активная подписка или бесплатный курс. */
export async function hasCourseAccess(
  user: { id: string; role: string; subscriptionUntil: Date | null } | null,
  course: { id: string; price: number },
): Promise<boolean> {
  if (course.price === 0) return true;
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.subscriptionUntil && user.subscriptionUntil.getTime() > Date.now()) return true;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { id: true },
  });
  return Boolean(enrollment);
}
