'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { loginAction, registerAction, type FormState } from '@/actions/auth';
import { SubmitButton } from '@/components/SubmitButton';

const initialState: FormState = {};

export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next: string }) {
  const isLogin = mode === 'login';
  const [state, formAction] = useActionState(isLogin ? loginAction : registerAction, initialState);

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="text-2xl font-semibold text-white">
        {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {isLogin
          ? 'Введите e-mail и пароль, чтобы продолжить обучение.'
          : 'Создайте аккаунт — это займёт меньше минуты.'}
      </p>

      <form action={formAction} className="mt-7 space-y-4">
        <input type="hidden" name="next" value={next} />

        {!isLogin && (
          <div>
            <label className="label" htmlFor="name">
              Имя
            </label>
            <input
              id="name"
              name="name"
              className="input"
              placeholder="Как к вам обращаться"
              autoComplete="name"
              required
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder={isLogin ? 'Ваш пароль' : 'Минимум 8 символов'}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={isLogin ? undefined : 8}
            required
          />
        </div>

        {state.error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
            {state.error}
          </p>
        )}

        <SubmitButton className="btn-primary w-full" pendingText="Проверяем…">
          {isLogin ? 'Войти' : 'Создать аккаунт'}
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {isLogin ? (
          <>
            Нет аккаунта?{' '}
            <Link href="/register" className="text-brand-300 hover:text-brand-100">
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-brand-300 hover:text-brand-100">
              Войти
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
