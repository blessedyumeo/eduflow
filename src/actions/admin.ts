'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/format';

const courseSchema = z.object({
  title: z.string().trim().min(3, 'Название слишком короткое').max(120),
  slug: z.string().trim().max(60).optional(),
  subtitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  author: z.string().trim().max(80).optional(),
  level: z.string().trim().max(40).optional(),
  cover: z.string().trim().max(300).optional(),
  /** Цена в рублях, в базе храним копейки. */
  price: z.coerce.number().min(0).max(1_000_000),
  published: z.coerce.boolean().optional(),
});

export async function createCourseAction(formData: FormData) {
  await requireAdmin();

  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/admin/courses?error=1');

  const data = parsed.data;
  const base = data.slug?.trim() ? slugify(data.slug) : slugify(data.title);
  let slug = base || `course-${Date.now()}`;
  if (await prisma.course.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const course = await prisma.course.create({
    data: {
      slug,
      title: data.title,
      subtitle: data.subtitle ?? '',
      description: data.description ?? '',
      author: data.author ?? '',
      level: data.level || 'Начальный',
      cover: data.cover || 'linear-gradient(135deg,#1f5ad6,#5ce2b4)',
      price: Math.round(data.price * 100),
      published: Boolean(data.published),
    },
  });

  revalidatePath('/admin/courses');
  revalidatePath('/courses');
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');

  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/courses/${id}?error=1`);

  const data = parsed.data;
  const slug = data.slug?.trim() ? slugify(data.slug) : undefined;

  await prisma.course.update({
    where: { id },
    data: {
      title: data.title,
      ...(slug ? { slug } : {}),
      subtitle: data.subtitle ?? '',
      description: data.description ?? '',
      author: data.author ?? '',
      level: data.level || 'Начальный',
      cover: data.cover || 'linear-gradient(135deg,#1f5ad6,#5ce2b4)',
      price: Math.round(data.price * 100),
      published: Boolean(data.published),
    },
  });

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath('/courses');
  redirect(`/admin/courses/${id}?saved=1`);
}

export async function toggleCoursePublishedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');

  const course = await prisma.course.findUnique({ where: { id }, select: { published: true } });
  if (!course) return;

  await prisma.course.update({ where: { id }, data: { published: !course.published } });
  revalidatePath('/admin/courses');
  revalidatePath('/courses');
}

export async function deleteCourseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  await prisma.course.delete({ where: { id } });
  revalidatePath('/admin/courses');
  revalidatePath('/courses');
  redirect('/admin/courses');
}

const lessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2, 'Название урока слишком короткое').max(160),
  description: z.string().trim().max(1000).optional(),
  videoUrl: z.string().trim().max(500).optional(),
  content: z.string().trim().max(20000).optional(),
  duration: z.coerce.number().min(0).max(600).optional(),
  isPreview: z.coerce.boolean().optional(),
});

export async function createLessonAction(formData: FormData) {
  await requireAdmin();

  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const data = parsed.data;
  const last = await prisma.lesson.findFirst({
    where: { courseId: data.courseId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  await prisma.lesson.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      description: data.description ?? '',
      videoUrl: data.videoUrl ?? '',
      content: data.content ?? '',
      duration: data.duration ?? 0,
      isPreview: Boolean(data.isPreview),
      position: (last?.position ?? 0) + 1,
    },
  });

  revalidatePath(`/admin/courses/${data.courseId}`);
}

export async function updateLessonAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');

  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const data = parsed.data;
  await prisma.lesson.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description ?? '',
      videoUrl: data.videoUrl ?? '',
      content: data.content ?? '',
      duration: data.duration ?? 0,
      isPreview: Boolean(data.isPreview),
    },
  });

  revalidatePath(`/admin/courses/${data.courseId}`);
}

export async function deleteLessonAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const courseId = String(formData.get('courseId') ?? '');
  await prisma.lesson.delete({ where: { id } });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function moveLessonAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const direction = String(formData.get('direction') ?? 'up');

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return;

  const neighbour = await prisma.lesson.findFirst({
    where:
      direction === 'up'
        ? { courseId: lesson.courseId, position: { lt: lesson.position } }
        : { courseId: lesson.courseId, position: { gt: lesson.position } },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbour) return;

  await prisma.$transaction([
    prisma.lesson.update({ where: { id: lesson.id }, data: { position: neighbour.position } }),
    prisma.lesson.update({ where: { id: neighbour.id }, data: { position: lesson.position } }),
  ]);

  revalidatePath(`/admin/courses/${lesson.courseId}`);
}

export async function setUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const role = formData.get('role') === 'ADMIN' ? 'ADMIN' : 'USER';

  // Нельзя разжаловать самого себя — иначе можно потерять доступ к админке.
  if (id === admin.id) return;

  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath('/admin/users');
}

export async function grantAccessAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const courseId = String(formData.get('courseId') ?? '');
  if (!userId || !courseId) return;

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, source: 'MANUAL' },
    update: {},
  });

  revalidatePath(`/admin/users/${userId}`);
}

export async function revokeAccessAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const courseId = String(formData.get('courseId') ?? '');

  await prisma.enrollment.deleteMany({ where: { userId, courseId } });
  revalidatePath(`/admin/users/${userId}`);
}

export async function markOrderPaidAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const { fulfillOrder } = await import('@/lib/orders');
  await fulfillOrder(id);
  revalidatePath('/admin/orders');
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  await prisma.order.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'CANCELED' },
  });
  revalidatePath('/admin/orders');
}
