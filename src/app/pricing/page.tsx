import type { Metadata } from 'next';
import Link from 'next/link';

import { buySubscriptionAction } from '@/actions/checkout';
import { SubmitButton } from '@/components/SubmitButton';
import { getCurrentUser, hasActiveSubscription } from '@/lib/auth';
import { formatDate, formatPrice } from '@/lib/format';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Подписка' };

export default async function PricingPage() {
  const user = await getCurrentUser();
  const pro = hasActiveSubscription(user);

  return (
    <div className="container-page py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Подписка EduFlow</h1>
        <p className="mt-3 text-slate-400">
          Один платёж — доступ ко всем курсам платформы, включая те, что выйдут в период действия
          подписки. Продление добавляется к остатку, ничего не сгорает.
        </p>
      </div>

      {pro && user?.subscriptionUntil && (
        <div className="card mt-8 border-accent/20 bg-accent/5 p-5 text-sm text-accent">
          Подписка активна до {formatDate(user.subscriptionUntil)}. Можно продлить в любой момент.
        </div>
      )}

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan, index) => {
          const featured = index === 1;
          return (
            <div
              key={plan.id}
              className={`card flex flex-col p-6 ${featured ? 'border-brand-400/40 ring-1 ring-brand-400/20' : ''}`}
            >
              {featured && (
                <span className="badge mb-4 w-fit border-brand-400/30 text-brand-200">
                  Выбирают чаще всего
                </span>
              )}
              <h2 className="text-lg font-semibold text-white">{plan.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{plan.note}</p>

              <p className="mt-6 text-3xl font-semibold text-white">{formatPrice(plan.price)}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatPrice(Math.round(plan.price / plan.months))} в месяц
              </p>

              <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-400">
                <li>• Все курсы каталога</li>
                <li>• Новые курсы в период подписки</li>
                <li>• Сохранение прогресса</li>
              </ul>

              <div className="mt-6">
                {user ? (
                  <form action={buySubscriptionAction}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <SubmitButton
                      className={featured ? 'btn-primary w-full' : 'btn-ghost w-full'}
                      pendingText="Готовим оплату…"
                    >
                      {pro ? 'Продлить' : 'Оформить'}
                    </SubmitButton>
                  </form>
                ) : (
                  <Link
                    href="/login?next=/pricing"
                    className={featured ? 'btn-primary w-full' : 'btn-ghost w-full'}
                  >
                    Войти и оформить
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Оплата проходит через ЮKassa. В демо-режиме (PAYMENT_MODE=mock) платёж эмулируется внутри
        приложения — ключи магазина не нужны.
      </p>
    </div>
  );
}
