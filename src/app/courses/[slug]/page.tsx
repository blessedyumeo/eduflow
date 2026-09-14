import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buyCourseAction } from '@/actions/checkout';
import { SubmitButton } from '@/components/SubmitButton';
import { getCurrentUser } from '@/lib/auth';
import { coverStyle } from '@/lib/cover';
import { formatDuration, formatPrice, pluralize } from '@/lib/format';
import { hasCourseAccess } from '@/lib/orders';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { title: true } });
  return { title: course?.title ?? 'Курс' };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: { lessons: { orderBy: { position: 'asc' } } },
  });

  if (!course || !course.published) notFound();

  const user = await getCurrentUser();
  const access = await hasCourseAccess(user, course);
  const totalDuration = course.lessons.reduce((sum, l) => sum + l.duration, 0);

  return (
    <div className="container-page py-12">
      <Link href="/courses" className="text-sm text-slate-500 transition hover:text-slate-300">
        ← Каталог
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div
            className="relative h-56 overflow-hidden rounded-xl2 border border-white/5 sm:h-64"
            style={coverStyle(course.cover)}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="badge">{course.level}</span>
            <span className="badge">
              {course.lessons.length} {pluralize(course.lessons.length, 'урок', 'урока', 'уроков')}
            </span>
            <span className="badge">{formatDuration(totalDuration)}</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">{course.title}</h1>
          <p className="mt-2 text-lg text-slate-400">{course.subtitle}</p>

          {course.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-slate-300">
              {course.description}
            </p>
          )}

          <h2 className="mt-10 text-xl font-semibold text-white">Программа курса</h2>
          <ol className="mt-4 space-y-2">
            {course.lessons.map((lesson, index) => (
              <li
                key={lesson.id}
                className="card flex items-center gap-4 px-5 py-4"
              >
                <span className="w-6 shrink-0 text-sm text-slate-600">{index + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">{lesson.title}</p>
                  {lesson.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{lesson.description}</p>
                  )}
                </div>
                {lesson.isPreview && !access && (
                  <span className="badge border-accent/30 text-accent">Бесплатно</span>
                )}
                <span className="shrink-0 text-xs text-slate-500">
                  {formatDuration(lesson.duration)}
                </span>
              </li>
            ))}
          </ol>

          {course.lessons.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">Уроки скоро появятся.</p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="text-3xl font-semibold text-white">{formatPrice(course.price)}</p>
            <p className="mt-1 text-sm text-slate-500">
              {course.price > 0 ? 'Разовая оплата, доступ навсегда' : 'Открытый курс без оплаты'}
            </p>

            <div className="mt-5 space-y-2.5">
              {access ? (
                <Link href={`/learn/${course.slug}`} className="btn-primary w-full">
                  Перейти к обучению
                </Link>
              ) : user ? (
                <form action={buyCourseAction}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <SubmitButton className="btn-primary w-full" pendingText="Готовим оплату…">
                    Купить курс
                  </SubmitButton>
                </form>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`}
                  className="btn-primary w-full"
                >
                  Войти и купить
                </Link>
              )}

              <Link href="/pricing" className="btn-ghost w-full">
                Или взять подписку
              </Link>
            </div>

            <ul className="mt-6 space-y-2.5 border-t border-white/5 pt-5 text-sm text-slate-400">
              <li>Автор: {course.author || '—'}</li>
              <li>Формат: видео и конспекты</li>
              <li>Прогресс сохраняется в кабинете</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
