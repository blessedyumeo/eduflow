import Link from 'next/link';

import { CourseCard } from '@/components/CourseCard';
import { getCurrentUser } from '@/lib/auth';
import { getPublishedCourses } from '@/lib/courses';
import { prisma } from '@/lib/prisma';
import { pluralize } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [courses, user, studentsCount] = await Promise.all([
    getPublishedCourses(),
    getCurrentUser(),
    prisma.user.count(),
  ]);

  const enrolledIds = user
    ? (
        await prisma.enrollment.findMany({
          where: { userId: user.id },
          select: { courseId: true },
        })
      ).map((e) => e.courseId)
    : [];

  const totalLessons = courses.reduce((sum, c) => sum + c.lessonsCount, 0);
  const totalHours = Math.round(courses.reduce((s, c) => s + c.totalDuration, 0) / 60);

  return (
    <>
      <section className="container-page pb-16 pt-16 sm:pt-24">
        <div className="max-w-3xl">
          <span className="badge">Платформа онлайн-обучения</span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Учитесь по программам, которые
            <span className="bg-gradient-to-r from-brand-300 to-accent bg-clip-text text-transparent">
              {' '}
              доводят до результата
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-400">
            Покупайте отдельный курс или откройте подписку и занимайтесь без ограничений.
            Прогресс сохраняется, доступ остаётся навсегда, оплата — через ЮKassa.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="btn-primary px-5 py-3 text-sm">
              Смотреть курсы
            </Link>
            <Link href="/pricing" className="btn-ghost px-5 py-3 text-sm">
              Как работает подписка
            </Link>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6">
            {[
              { value: courses.length, label: pluralize(courses.length, 'курс', 'курса', 'курсов') },
              { value: totalLessons, label: 'уроков' },
              { value: `${totalHours}+`, label: 'часов практики' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-semibold text-white">{stat.value}</dt>
                <dd className="mt-1 text-sm text-slate-500">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Каталог</h2>
            <p className="mt-1 text-sm text-slate-500">
              {studentsCount} {pluralize(studentsCount, 'человек уже учится', 'человека уже учатся', 'человек уже учатся')}
            </p>
          </div>
          <Link href="/courses" className="text-sm text-brand-300 transition hover:text-brand-100">
            Все курсы →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 6).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              owned={enrolledIds.includes(course.id)}
            />
          ))}
        </div>

        {courses.length === 0 && (
          <div className="card p-10 text-center text-slate-400">
            Курсов пока нет. Зайдите в админку и создайте первый курс.
          </div>
        )}
      </section>

      <section className="container-page mt-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Практика, а не лекции',
              text: 'Каждый урок заканчивается заданием, прогресс виден в личном кабинете.',
            },
            {
              title: 'Честная оплата',
              text: 'Курс покупается разово или входит в подписку. Доступ открывается сразу после оплаты.',
            },
            {
              title: 'Живая программа',
              text: 'Авторы обновляют уроки через админку — материалы не устаревают.',
            },
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
