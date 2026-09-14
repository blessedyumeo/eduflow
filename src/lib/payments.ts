import 'server-only';

import { randomUUID } from 'crypto';

const API = 'https://api.yookassa.ru/v3';

export type PaymentMode = 'mock' | 'yookassa';

export function paymentMode(): PaymentMode {
  return process.env.PAYMENT_MODE === 'yookassa' ? 'yookassa' : 'mock';
}

/**
 * Публичный адрес приложения. На Vercel домен известен только после деплоя,
 * поэтому если APP_URL не задан — берём его из переменных, которые Vercel
 * подставляет сам.
 */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;

  return 'http://localhost:3000';
}

function authHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) {
    throw new Error(
      'PAYMENT_MODE=yookassa, но YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY не заданы в .env',
    );
  }
  return 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64');
}

/** Копейки -> строка вида "1990.00", как требует ЮKassa. */
export function toRubString(kopecks: number): string {
  return (kopecks / 100).toFixed(2);
}

export type CreatedPayment = {
  provider: PaymentMode;
  paymentId: string;
  confirmationUrl: string;
};

export async function createPayment(params: {
  orderId: string;
  amount: number; // копейки
  description: string;
  customerEmail?: string;
}): Promise<CreatedPayment> {
  const mode = paymentMode();

  // Демо-режим: платёж эмулируется внутри приложения, ключи не нужны.
  if (mode === 'mock') {
    // Относительный путь — работает на любом домене без настройки APP_URL.
    return {
      provider: 'mock',
      paymentId: `mock_${randomUUID()}`,
      confirmationUrl: `/checkout/${params.orderId}`,
    };
  }

  const body = {
    amount: { value: toRubString(params.amount), currency: 'RUB' },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: `${appUrl()}/checkout/${params.orderId}/return`,
    },
    description: params.description.slice(0, 128),
    metadata: { orderId: params.orderId },
    ...(params.customerEmail
      ? {
          receipt: {
            customer: { email: params.customerEmail },
            items: [
              {
                description: params.description.slice(0, 128),
                quantity: '1.00',
                amount: { value: toRubString(params.amount), currency: 'RUB' },
                vat_code: 1,
                payment_mode: 'full_payment',
                payment_subject: 'service',
              },
            ],
          },
        }
      : {}),
  };

  const res = await fetch(`${API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Idempotence-Key': params.orderId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(
      `ЮKassa вернула ошибку ${res.status}: ${JSON.stringify(json).slice(0, 300)}`,
    );
  }

  const confirmation = json.confirmation as { confirmation_url?: string } | undefined;
  if (!confirmation?.confirmation_url) {
    throw new Error('ЮKassa не вернула confirmation_url');
  }

  return {
    provider: 'yookassa',
    paymentId: String(json.id),
    confirmationUrl: confirmation.confirmation_url,
  };
}

export type RemotePayment = {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid: boolean;
  metadata: Record<string, string>;
};

/** Проверка статуса платежа на стороне ЮKassa (используется на return-странице). */
export async function fetchPayment(paymentId: string): Promise<RemotePayment | null> {
  if (paymentMode() === 'mock') return null;

  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const json = (await res.json()) as Record<string, unknown>;

  return {
    id: String(json.id),
    status: json.status as RemotePayment['status'],
    paid: Boolean(json.paid),
    metadata: (json.metadata as Record<string, string>) ?? {},
  };
}

export const SUBSCRIPTION_PLANS = [
  { id: 'month', months: 1, price: 99000, title: '1 месяц', note: 'Пробуем формат' },
  { id: 'half', months: 6, price: 490000, title: '6 месяцев', note: 'Выгоднее на 18%' },
  { id: 'year', months: 12, price: 890000, title: '12 месяцев', note: 'Выгоднее на 25%' },
] as const;

export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLANS)[number]['id'];

export function findPlan(id: string) {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id) ?? null;
}
