import Link from 'next/link';

import { setUserRoleAction } from '@/actions/admin';
import { SubmitButton } from '@/components/SubmitButton';
import { formatDate } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Пользователи · Админка' };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { _count: { select: { enrollments: true, orders: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Пользователи</h1>

      <form className="mt-5 flex gap-2" action="/admin/users">
        <input
          name="q"
          defaultValue={q ?? ''}
          className="input max-w-xs"
          placeholder="Поиск по имени или e-mail"
        />
        <button className="btn-ghost" type="submit">
          Найти
        </button>
      </form>

      <div className="card mt-5 overflow-x-auto">
        <table className="table-base min-w-[760px]">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Регистрация</th>
              <th>Подписка</th>
              <th>Курсов</th>
              <th>Заказов</th>
              <th>Роль</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const pro =
                user.subscriptionUntil && user.subscriptionUntil.getTime() > Date.now();
              return (
                <tr key={user.id}>
                  <td>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium text-white hover:text-brand-200"
                    >
                      {user.name}
                    </Link>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(user.createdAt)}</td>
                  <td className={pro ? 'text-accent' : 'text-slate-500'}>
                    {pro ? `до ${formatDate(user.subscriptionUntil)}` : 'нет'}
                  </td>
                  <td>{user._count.enrollments}</td>
                  <td>{user._count.orders}</td>
                  <td>{user.role === 'ADMIN' ? 'Админ' : 'Студент'}</td>
                  <td className="text-right">
                    <form action={setUserRoleAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={user.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                      />
                      <SubmitButton className="btn-ghost px-3 py-1.5 text-xs">
                        {user.role === 'ADMIN' ? 'Снять админа' : 'Сделать админом'}
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  Никого не нашлось
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
