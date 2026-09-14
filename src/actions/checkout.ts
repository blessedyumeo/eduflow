'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cancelOrder, fulfillOrder, hasCourseAccess } from '@/lib/orders';
import { createPayment, findPlan } from '@/lib/payments';

/** Покупка отдельного курса. Ведёт на страницу оплаты провайдера. */
export async function buyCourseAction(formData: FormData) {
  const user = await requireUser();
  const courseId = String(formData.get('courseId') ?? '');

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) redirect('/courses');

  if (await hasCourseAccess(user, course)) {
    redirect(`/learn/${course.slug}`);
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      courseId: course.id,
      type: 'COURSE',
      amount: course.price,
      months: 0,
    },
  });

  const payment = await createPayment({
    orderId: order.id,
    amount: course.price,
    description: `Курс «${course.title}»`,
    customerEmail: user.email,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      provider: payment.provider,
      paymentId: payment.paymentId,
      confirmationUrl: payment.confirmationUrl,
    },
  });

  redirect(payment.confirmationUrl);
}

/** Оформление подписки на выбранный период. */
export async function buySubscriptionAction(formData: FormData) {
  const user = await requireUser();
  const plan = findPlan(String(formData.get('planId') ?? ''));
  if (!plan) redirect('/pricing');

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      type: 'SUBSCRIPTION',
      amount: plan.price,
      months: plan.months,
    },
  });

  const payment = await createPayment({
    orderId: order.id,
    amount: plan.price,
    description: `Подписка EduFlow, ${plan.title}`,
    customerEmail: user.email,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      provider: payment.provider,
      paymentId: payment.paymentId,
      confirmationUrl: payment.confirmationUrl,
    },
  });

  redirect(payment.confirmationUrl);
}

/** Эмуляция успешной оплаты (PAYMENT_MODE=mock). */
export async function mockPayAction(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get('orderId') ?? '');

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id, provider: 'mock', status: 'PENDING' },
  });
  if (!order) redirect('/dashboard');

  await fulfillOrder(order.id);
  revalidatePath('/dashboard');
  redirect(`/checkout/${order.id}/return`);
}

/** Эмуляция отказа от оплаты. */
export async function mockCancelAction(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get('orderId') ?? '');

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) redirect('/dashboard');

  await cancelOrder(order.id);
  redirect(`/checkout/${order.id}/return`);
}
