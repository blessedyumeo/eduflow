import 'server-only';

import { prisma } from '@/lib/prisma';

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  level: string;
  author: string;
  price: number;
  cover: string;
  lessonsCount: number;
  totalDuration: number;
};

export async function getPublishedCourses(): Promise<CourseCardData[]> {
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: [{ price: 'asc' }, { createdAt: 'desc' }],
    include: { lessons: { select: { duration: true } } },
  });

  return courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    level: course.level,
    author: course.author,
    price: course.price,
    cover: course.cover,
    lessonsCount: course.lessons.length,
    totalDuration: course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
  }));
}
