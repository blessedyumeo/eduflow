import Link from 'next/link';

import { coverStyle } from '@/lib/cover';
import { formatPrice, formatDuration, pluralize } from '@/lib/format';

type Props = {
  course: {
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
  owned?: boolean;
};

export function CourseCard({ course, owned = false }: Props) {
  return (
    <Link
      href={owned ? `/learn/${course.slug}` : `/courses/${course.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:border-brand-400/30"
    >
      <div className="relative h-36 w-full overflow-hidden" style={coverStyle(course.cover)}>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-950/25 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-medium text-white">
          {course.level}
        </span>
        {owned && (
          <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-ink-950">
            Куплено
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-white transition group-hover:text-brand-100">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-400">{course.subtitle}</p>

        <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
          <span>
            {course.lessonsCount}{' '}
            {pluralize(course.lessonsCount, 'урок', 'урока', 'уроков')}
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>{formatDuration(course.totalDuration)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-sm text-slate-400">{course.author}</span>
          <span className="text-sm font-semibold text-white">
            {owned ? 'Открыть' : formatPrice(course.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
