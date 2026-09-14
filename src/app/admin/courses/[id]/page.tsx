import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  createLessonAction,
  deleteCourseAction,
  deleteLessonAction,
  moveLessonAction,
  updateCourseAction,
  updateLessonAction,
} from '@/actions/admin';
import { CourseFormFields } from '@/components/admin/CourseFormFields';
import { SubmitButton } from '@/components/SubmitButton';
import { formatDuration } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminCoursePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { saved, error } = await searchParams;

  const course = await prisma.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { position: 'asc' } } },
  });

  if (!course) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/courses" className="text-sm text-slate-500 hover:text-slate-300">
            ← Все курсы
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">{course.title}</h1>
        </div>
        <Link href={`/courses/${course.slug}`} className="btn-ghost text-xs">
          Открыть на сайте
        </Link>
      </div>

      {saved && (
        <p className="card mt-4 border-accent/20 bg-accent/5 p-3 text-sm text-accent">
          Изменения сохранены.
        </p>
      )}
      {error && (
        <p className="card mt-4 border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">
          Проверьте поля формы.
        </p>
      )}

      <section className="card mt-6 p-6">
        <h2 className="text-base font-semibold text-white">Настройки курса</h2>
        <form action={updateCourseAction} className="mt-5">
          <input type="hidden" name="id" value={course.id} />
          <CourseFormFields course={course} />
          <div className="mt-6 flex flex-wrap gap-3">
            <SubmitButton pendingText="Сохраняем…">Сохранить</SubmitButton>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-white">
          Уроки ({course.lessons.length})
        </h2>

        <div className="mt-4 space-y-3">
          {course.lessons.map((lesson, index) => (
            <details key={lesson.id} className="card p-0">
              <summary className="flex cursor-pointer items-center gap-3 px-5 py-4">
                <span className="w-6 text-sm text-slate-600">{index + 1}</span>
                <span className="flex-1 text-sm font-medium text-slate-100">{lesson.title}</span>
                {lesson.isPreview && <span className="badge text-xs">превью</span>}
                <span className="text-xs text-slate-500">{formatDuration(lesson.duration)}</span>
              </summary>

              <div className="border-t border-white/5 p-5">
                <form action={updateLessonAction} className="grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="id" value={lesson.id} />
                  <input type="hidden" name="courseId" value={course.id} />

                  <div className="sm:col-span-2">
                    <label className="label">Название</label>
                    <input name="title" className="input" defaultValue={lesson.title} required />
                  </div>

                  <div>
                    <label className="label">Длительность, мин</label>
                    <input
                      name="duration"
                      type="number"
                      min={0}
                      className="input"
                      defaultValue={lesson.duration}
                    />
                  </div>

                  <div>
                    <label className="label">Ссылка на видео</label>
                    <input
                      name="videoUrl"
                      className="input"
                      defaultValue={lesson.videoUrl}
                      placeholder="https://youtu.be/…"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Краткое описание</label>
                    <input
                      name="description"
                      className="input"
                      defaultValue={lesson.description}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Конспект</label>
                    <textarea
                      name="content"
                      rows={5}
                      className="input"
                      defaultValue={lesson.content}
                    />
                  </div>

                  <label className="flex items-center gap-2.5 text-sm text-slate-300 sm:col-span-2">
                    <input
                      type="checkbox"
                      name="isPreview"
                      defaultChecked={lesson.isPreview}
                      className="h-4 w-4 rounded border-white/20 bg-ink-900"
                    />
                    Бесплатный превью-урок
                  </label>

                  <div className="sm:col-span-2">
                    <SubmitButton pendingText="Сохраняем…">Сохранить урок</SubmitButton>
                  </div>
                </form>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                  <form action={moveLessonAction}>
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="direction" value="up" />
                    <SubmitButton className="btn-ghost px-3 py-1.5 text-xs">↑ Выше</SubmitButton>
                  </form>
                  <form action={moveLessonAction}>
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="direction" value="down" />
                    <SubmitButton className="btn-ghost px-3 py-1.5 text-xs">↓ Ниже</SubmitButton>
                  </form>
                  <form action={deleteLessonAction} className="ml-auto">
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="courseId" value={course.id} />
                    <SubmitButton className="btn-danger px-3 py-1.5 text-xs">
                      Удалить урок
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </details>
          ))}

          {course.lessons.length === 0 && (
            <p className="card p-8 text-center text-sm text-slate-500">
              Уроков пока нет — добавьте первый ниже.
            </p>
          )}
        </div>

        <details className="card mt-4 p-6">
          <summary className="cursor-pointer text-sm font-medium text-brand-300">
            + Добавить урок
          </summary>
          <form action={createLessonAction} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="courseId" value={course.id} />

            <div className="sm:col-span-2">
              <label className="label">Название</label>
              <input name="title" className="input" required />
            </div>

            <div>
              <label className="label">Длительность, мин</label>
              <input name="duration" type="number" min={0} className="input" defaultValue={15} />
            </div>

            <div>
              <label className="label">Ссылка на видео</label>
              <input name="videoUrl" className="input" placeholder="https://youtu.be/…" />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Краткое описание</label>
              <input name="description" className="input" />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Конспект</label>
              <textarea name="content" rows={4} className="input" />
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-300 sm:col-span-2">
              <input
                type="checkbox"
                name="isPreview"
                className="h-4 w-4 rounded border-white/20 bg-ink-900"
              />
              Бесплатный превью-урок
            </label>

            <div className="sm:col-span-2">
              <SubmitButton pendingText="Добавляем…">Добавить урок</SubmitButton>
            </div>
          </form>
        </details>
      </section>

      <section className="card mt-8 border-red-500/20 p-6">
        <h2 className="text-base font-semibold text-red-200">Опасная зона</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Удаление курса убирает его уроки, доступы студентов и связи с заказами.
        </p>
        <form action={deleteCourseAction} className="mt-4">
          <input type="hidden" name="id" value={course.id} />
          <SubmitButton className="btn-danger" pendingText="Удаляем…">
            Удалить курс
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
