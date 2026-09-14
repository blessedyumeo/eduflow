import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { toggleLessonAction } from '@/actions/learning';
import { LessonPlayer } from '@/components/LessonPlayer';
import { SubmitButton } from '@/components/SubmitButton';
import { requireUser } from '@/lib/auth';
import { formatDuration, pluralize } from '@/lib/format';
import { hasCourseAccess } from '@/lib/orders';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { title: true } });
  return { title: course?.title ?? 'Обучение' };
}

export default async function LearnPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const { slug } = await params;
  const { lesson: lessonParam } = await searchParams;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: { lessons: { orderBy: { position: 'asc' } } },
  });

  if (!course) notFound();

  if (!(await hasCourseAccess(user, course))) {
    redirect(`/courses/${course.slug}`);
  }

  if (course.lessons.length === 0) {
    return (
      <div className="container-page py-16">
        <h1 className="text-2xl font-semibold text-white">{course.title}</h1>
        <p className="mt-3 text-slate-400">В этом курсе пока нет уроков.</p>
        <Link href="/dashboard" className="btn-ghost mt-6">
          В личный кабинет
        </Link>
      </div>
    );
  }

  const current =
    course.lessons.find((lesson) => lesson.id === lessonParam) ?? course.lessons[0];

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: course.lessons.map((l) => l.id) }, completed: true },
    select: { lessonId: true },
  });
  const completed = new Set(progress.map((p) => p.lessonId));

  const index = course.lessons.findIndex((l) => l.id === current.id);
  const prev = index > 0 ? course.lessons[index - 1] : null;
  const next = index < course.lessons.length - 1 ? course.lessons[index + 1] : null;
  const percent = Math.round((completed.size / course.lessons.length) * 100);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300">
            ← Мои курсы
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">{course.title}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">
            Пройдено {completed.size} из {course.lessons.length}{' '}
            {pluralize(course.lessons.length, 'урока', 'уроков', 'уроков')}
          </p>
          <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="card h-fit overflow-hidden lg:sticky lg:top-24">
          <p className="border-b border-white/5 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Программа
          </p>
          <ol className="max-h-[70vh] overflow-y-auto py-2">
            {course.lessons.map((lesson, i) => {
              const active = lesson.id === current.id;
              const done = completed.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/learn/${course.slug}?lesson=${lesson.id}`}
                    className={`flex items-start gap-3 px-5 py-3 text-sm transition ${
                      active ? 'bg-brand-500/10 text-white' : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                        done
                          ? 'border-accent bg-accent text-ink-950'
                          : 'border-white/15 text-slate-500'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span className="flex-1 leading-snug">{lesson.title}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>

        <section>
          <LessonPlayer url={current.videoUrl} title={current.title} />

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Урок {index + 1} · {formatDuration(current.duration)}
              </p>
              <h2 className="mt-1.5 text-xl font-semibold text-white">{current.title}</h2>
              {current.description && (
                <p className="mt-2 text-slate-400">{current.description}</p>
              )}
            </div>

            <form action={toggleLessonAction}>
              <input type="hidden" name="lessonId" value={current.id} />
              <SubmitButton
                className={completed.has(current.id) ? 'btn-ghost' : 'btn-primary'}
                pendingText="Сохраняем…"
              >
                {completed.has(current.id) ? 'Отметить непройденным' : 'Урок пройден'}
              </SubmitButton>
            </form>
          </div>

          {current.content && (
            <article className="card mt-6 whitespace-pre-line p-6 leading-relaxed text-slate-300">
              {current.content}
            </article>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {prev ? (
              <Link href={`/learn/${course.slug}?lesson=${prev.id}`} className="btn-ghost">
                ← {prev.title.slice(0, 28)}
                {prev.title.length > 28 ? '…' : ''}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/learn/${course.slug}?lesson=${next.id}`} className="btn-ghost">
                {next.title.slice(0, 28)}
                {next.title.length > 28 ? '…' : ''} →
              </Link>
            ) : (
              <span className="text-sm text-slate-500">Это последний урок курса</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
