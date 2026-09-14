'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasCourseAccess } from '@/lib/orders';

export async function toggleLessonAction(formData: FormData) {
  const user = await requireUser();
  const lessonId = String(formData.get('lessonId') ?? '');

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { id: true, slug: true, price: true } } },
  });
  if (!lesson) return;

  if (!(await hasCourseAccess(user, lesson.course))) return;

  const current = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  const completed = !current?.completed;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, completed, completedAt: completed ? new Date() : null },
    update: { completed, completedAt: completed ? new Date() : null },
  });

  revalidatePath(`/learn/${lesson.course.slug}`);
  revalidatePath('/dashboard');
}
