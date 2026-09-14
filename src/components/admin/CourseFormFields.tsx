import { coverStyle, DEFAULT_COVER } from '@/lib/cover';

const COVER_PRESETS = [
  { value: '/covers/react.svg', label: 'Программирование / фронтенд' },
  { value: '/covers/python.svg', label: 'Данные и аналитика' },
  { value: '/covers/uiux.svg', label: 'Дизайн интерфейсов' },
  { value: '/covers/sql.svg', label: 'Базы данных' },
  { value: DEFAULT_COVER, label: 'Градиент по умолчанию' },
];

type CourseLike = {
  title?: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  author?: string;
  level?: string;
  cover?: string;
  price?: number; // копейки
  published?: boolean;
};

const LEVELS = ['Начальный', 'Средний', 'Продвинутый'];

export function CourseFormFields({ course }: { course?: CourseLike }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">
          Название
        </label>
        <input
          id="title"
          name="title"
          className="input"
          defaultValue={course?.title ?? ''}
          placeholder="Например: React с нуля до продакшена"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="slug">
          Адрес (slug)
        </label>
        <input
          id="slug"
          name="slug"
          className="input"
          defaultValue={course?.slug ?? ''}
          placeholder="сгенерируется из названия"
        />
      </div>

      <div>
        <label className="label" htmlFor="price">
          Цена, ₽
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min={0}
          step={100}
          className="input"
          defaultValue={course ? (course.price ?? 0) / 100 : 0}
          required
        />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="subtitle">
          Подзаголовок
        </label>
        <input
          id="subtitle"
          name="subtitle"
          className="input"
          defaultValue={course?.subtitle ?? ''}
          placeholder="Одна строка о том, что получит студент"
        />
      </div>

      <div>
        <label className="label" htmlFor="author">
          Автор
        </label>
        <input
          id="author"
          name="author"
          className="input"
          defaultValue={course?.author ?? ''}
        />
      </div>

      <div>
        <label className="label" htmlFor="level">
          Уровень
        </label>
        <select id="level" name="level" className="input" defaultValue={course?.level ?? LEVELS[0]}>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="cover">
          Обложка
        </label>
        <div className="flex items-start gap-3">
          <div
            className="h-16 w-28 shrink-0 rounded-lg border border-white/10"
            style={coverStyle(course?.cover)}
            aria-hidden
          />
          <div className="flex-1">
            <input
              id="cover"
              name="cover"
              className="input"
              list="cover-presets"
              defaultValue={course?.cover ?? DEFAULT_COVER}
            />
            <datalist id="cover-presets">
              {COVER_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </datalist>
            <p className="mt-1.5 text-xs text-slate-500">
              Путь к файлу в <code>/public</code> (например <code>/covers/react.svg</code>),
              ссылка на картинку или CSS-градиент. Превью слева обновится после сохранения.
            </p>
          </div>
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="description">
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="input"
          defaultValue={course?.description ?? ''}
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-slate-300 sm:col-span-2">
        <input
          type="checkbox"
          name="published"
          defaultChecked={course?.published ?? false}
          className="h-4 w-4 rounded border-white/20 bg-ink-900"
        />
        Опубликован (виден в каталоге)
      </label>
    </div>
  );
}
