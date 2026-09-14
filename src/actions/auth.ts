'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createSession, destroySession, hashPassword, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type FormState = { error?: string };

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Имя должно быть не короче 2 символов').max(80),
  email: z.string().trim().toLowerCase().email('Введите корректный e-mail'),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов').max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Введите корректный e-mail'),
  password: z.string().min(1, 'Введите пароль'),
});

function redirectTarget(raw: FormDataEntryValue | null): string {
  const value = typeof raw === 'string' ? raw : '';
  // Пускаем только внутренние пути — защита от open redirect.
  return value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Проверьте данные формы' };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { error: 'Пользователь с таким e-mail уже зарегистрирован' };
  }

  // Первый зарегистрированный пользователь становится администратором.
  const usersCount = await prisma.user.count();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: usersCount === 0 ? 'ADMIN' : 'USER',
    },
    select: { id: true, email: true, role: true },
  });

  await createSession(user);
  redirect(redirectTarget(formData.get('next')));
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Проверьте данные формы' };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: 'Неверный e-mail или пароль' };
  }

  await createSession({ id: user.id, email: user.email, role: user.role });
  redirect(redirectTarget(formData.get('next')));
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}
