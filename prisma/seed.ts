import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type SeedLesson = {
  title: string;
  duration: number;
  description?: string;
  isPreview?: boolean;
};

type SeedCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  author: string;
  level: string;
  price: number;
  cover: string;
  lessons: SeedLesson[];
};

const courses: SeedCourse[] = [
  {
    slug: 'react-s-nulya',
    title: 'React с нуля до продакшена',
    subtitle: 'Хуки, состояние, роутинг и деплой реального приложения',
    description:
      'Практический курс для тех, кто уже знает JavaScript и хочет уверенно писать интерфейсы. ' +
      'Разбираем хуки, композицию компонентов, работу с сервером, тестирование и выкатку в продакшен. ' +
      'В финале собираем полноценное приложение и разворачиваем его.',
    author: 'Анна Крылова',
    level: 'Средний',
    price: 1490000,
    cover: '/covers/react.svg',
    lessons: [
      { title: 'Как устроен React и зачем нужен виртуальный DOM', duration: 18, isPreview: true },
      { title: 'Компоненты, props и композиция', duration: 24, isPreview: true },
      { title: 'Состояние: useState и useReducer', duration: 31 },
      { title: 'Эффекты и жизненный цикл', duration: 27 },
      { title: 'Работа с сервером и кэширование данных', duration: 35 },
      { title: 'Роутинг и защищённые страницы', duration: 22 },
      { title: 'Тестирование компонентов', duration: 26 },
      { title: 'Сборка и деплой', duration: 19 },
    ],
  },
  {
    slug: 'python-dlya-analiza-dannyh',
    title: 'Python для анализа данных',
    subtitle: 'pandas, визуализация и первые ML-модели на реальных датасетах',
    description:
      'Курс для аналитиков и разработчиков, которым нужно быстро извлекать смысл из данных. ' +
      'От чистки таблиц и группировок до графиков, которые не стыдно показать заказчику, ' +
      'и базовых моделей машинного обучения.',
    author: 'Игорь Дементьев',
    level: 'Начальный',
    price: 990000,
    cover: '/covers/python.svg',
    lessons: [
      { title: 'Настройка окружения и Jupyter', duration: 14, isPreview: true },
      { title: 'pandas: таблицы, фильтры, группировки', duration: 38 },
      { title: 'Чистка грязных данных', duration: 29 },
      { title: 'Визуализация: matplotlib и seaborn', duration: 33 },
      { title: 'Статистика, которая реально нужна', duration: 25 },
      { title: 'Первая модель: регрессия и классификация', duration: 41 },
      { title: 'Как рассказать о результатах бизнесу', duration: 17 },
    ],
  },
  {
    slug: 'ui-ux-dizayn-interfeysov',
    title: 'UI/UX: дизайн интерфейсов',
    subtitle: 'От исследования пользователей до готового макета в Figma',
    description:
      'Учимся проектировать интерфейсы, которыми удобно пользоваться: интервью, сценарии, ' +
      'прототипы, типографика, сетки и дизайн-система. Каждый модуль заканчивается заданием ' +
      'с разбором, в портфолио остаётся два готовых кейса.',
    author: 'Мария Соболева',
    level: 'Начальный',
    price: 1290000,
    cover: '/covers/uiux.svg',
    lessons: [
      { title: 'Что такое UX и почему это не про красоту', duration: 16, isPreview: true },
      { title: 'Исследование: интервью и сценарии', duration: 28 },
      { title: 'Информационная архитектура', duration: 23 },
      { title: 'Сетки, отступы, типографика', duration: 30 },
      { title: 'Компоненты и дизайн-система', duration: 34 },
      { title: 'Прототип и тестирование на людях', duration: 26 },
    ],
  },
  {
    slug: 'osnovy-sql',
    title: 'Основы SQL',
    subtitle: 'Бесплатный вводный курс: запросы, джойны, агрегации',
    description:
      'Короткий бесплатный курс, чтобы перестать бояться баз данных. Разбираем SELECT, ' +
      'фильтрацию, соединения таблиц и агрегатные функции на живой базе интернет-магазина.',
    author: 'Игорь Дементьев',
    level: 'Начальный',
    price: 0,
    cover: '/covers/sql.svg',
    lessons: [
      { title: 'Таблицы, строки и первый SELECT', duration: 12, isPreview: true },
      { title: 'Фильтрация и сортировка', duration: 15 },
      { title: 'JOIN: соединяем таблицы', duration: 21 },
      { title: 'Группировки и агрегации', duration: 18 },
    ],
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@eduflow.ru';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      name: 'Администратор',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@eduflow.ru' },
    update: {},
    create: {
      email: 'student@eduflow.ru',
      name: 'Пётр Студентов',
      passwordHash: await bcrypt.hash('student12345', 10),
      role: 'USER',
    },
  });

  for (const course of courses) {
    const created = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        author: course.author,
        level: course.level,
        price: course.price,
        cover: course.cover,
        published: true,
      },
      create: {
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        author: course.author,
        level: course.level,
        price: course.price,
        cover: course.cover,
        published: true,
      },
    });

    await prisma.lesson.deleteMany({ where: { courseId: created.id } });
    await prisma.lesson.createMany({
      data: course.lessons.map((lesson, index) => ({
        courseId: created.id,
        title: lesson.title,
        description: lesson.description ?? '',
        content:
          'Здесь будет конспект урока. В админке текст редактируется вместе со ссылкой на видео.',
        duration: lesson.duration,
        position: index + 1,
        isPreview: Boolean(lesson.isPreview),
      })),
    });
  }

  // Демо-студенту открываем один курс, чтобы кабинет не был пустым.
  const react = await prisma.course.findUnique({ where: { slug: 'react-s-nulya' } });
  if (react) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: react.id } },
      update: {},
      create: { userId: student.id, courseId: react.id, source: 'MANUAL' },
    });

    const first = await prisma.lesson.findFirst({
      where: { courseId: react.id },
      orderBy: { position: 'asc' },
    });
    if (first) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: student.id, lessonId: first.id } },
        update: { completed: true, completedAt: new Date() },
        create: {
          userId: student.id,
          lessonId: first.id,
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    await prisma.order.create({
      data: {
        userId: student.id,
        courseId: react.id,
        type: 'COURSE',
        amount: react.price,
        status: 'SUCCEEDED',
        provider: 'mock',
        paymentId: 'mock_seed_order',
        paidAt: new Date(),
      },
    });
  }

  console.log('Готово.');
  console.log(`  Администратор: ${admin.email} / ${adminPassword}`);
  console.log('  Студент:       student@eduflow.ru / student12345');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
