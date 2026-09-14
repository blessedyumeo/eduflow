import Link from 'next/link';

import { createCourseAction, toggleCoursePublishedAction } from '@/actions/admin';
import { CourseFormFields } from '@/components/admin/CourseFormFields';
import { SubmitButton } from '@/components/SubmitButton';
import { coverStyle } from '@/lib/cover';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Курсы · Админка' };

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { lessons: true, enrollments: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Курсы</h1>

      <details className="card mt-6 p-6">
        <summary className="cursor-pointer text-sm font-medium text-brand-300">
          + Создать курс
        </summary>
        <form action={createCourseAction} className="mt-6">
          <CourseFormFields />
          <div className="mt-6">
            <SubmitButton pendingText="Создаём…">Создать курс</SubmitButton>
          </div>
        </form>
      </details>

      <div className="card mt-6 overflow-x-auto">
        <table className="table-base min-w-[720px]">
          <thead>
            <tr>
              <th>Курс</th>
              <th>Цена</th>
              <th>Уроков</th>
              <th>Учеников</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-16 shrink-0 rounded-md border border-white/10"
                      style={coverStyle(course.cover)}
                      aria-hidden
                    />
                    <div>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="font-medium text-white hover:text-brand-200"
                      >
                        {course.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-slate-600">/{course.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap">{formatPrice(course.price)}</td>
                <td>{course._count.lessons}</td>
                <td>{course._count.enrollments}</td>
                <td>
                  <span
                    className={
                      course.published ? 'text-accent' : 'text-slate-500'
                    }
                  >
                    {course.published ? 'Опубликован' : 'Черновик'}
                  </span>
                </td>
                <td className="text-right">
                  <form action={toggleCoursePublishedAction}>
                    <input type="hidden" name="id" value={course.id} />
                    <SubmitButton className="btn-ghost px-3 py-1.5 text-xs">
                      {course.published ? 'Снять' : 'Опубликовать'}
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  Курсов ещё нет — создайте первый.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
