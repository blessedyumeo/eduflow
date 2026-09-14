import type { Metadata } from 'next';

import { CourseCard } from '@/components/CourseCard';
import { getCurrentUser, hasActiveSubscription } from '@/lib/auth';
import { getPublishedCourses } from '@/lib/courses';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Каталог курсов' };

export default async function CoursesPage() {
  const [courses, user] = await Promise.all([getPublishedCourses(), getCurrentUser()]);

  const enrolledIds = user
    ? (
        await prisma.enrollment.findMany({
          where: { userId: user.id },
          select: { courseId: true },
        })
      ).map((e) => e.courseId)
    : [];

  const pro = hasActiveSubscription(user);

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Каталог курсов</h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        {pro
          ? 'У вас активна подписка — все курсы уже открыты.'
          : 'Купите курс отдельно или оформите подписку и занимайтесь без ограничений.'}
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            owned={pro || enrolledIds.includes(course.id) || course.price === 0}
          />
        ))}
      </div>

      {courses.length === 0 && (
        <div className="card mt-10 p-10 text-center text-slate-400">
          Опубликованных курсов пока нет.
        </div>
      )}
    </div>
  );
}
