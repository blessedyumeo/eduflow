# EduFlow — платформа онлайн-курсов

Учебный fullstack-проект для портфолио: каталог курсов, регистрация и вход,
покупка курса или подписки через **ЮKassa**, личный кабинет с прогрессом
и полноценная **админка**.

**Стек:** Next.js 15 (App Router, Server Actions) · TypeScript · Prisma · PostgreSQL ·
Tailwind CSS · собственная JWT-авторизация (jose + bcrypt).

---

## Что внутри

**Витрина**

- Лендинг со статистикой, каталог курсов, страница курса с программой
- Плеер уроков (YouTube / MP4 / произвольный iframe), конспекты, отметка «урок пройден»
- Личный кабинет: прогресс по каждому курсу, история платежей

**Аккаунты**

- Регистрация и вход по e-mail и паролю, пароли через bcrypt
- Сессия — JWT в httpOnly-cookie, проверка в middleware
- Роли `USER` / `ADMIN`; первый зарегистрированный пользователь становится админом

**Оплата**

- Разовая покупка курса и подписка на 1 / 6 / 12 месяцев
- Интеграция с ЮKassa: создание платежа, редирект, вебхук, перепроверка статуса
- Демо-режим `mock` — платёж эмулируется внутри приложения, ключи магазина не нужны
- Выдача доступа идемпотентна: повторный вебхук ничего не ломает

**Админка** (`/admin`)

- Обзор: пользователи, курсы, выручка всего и за 30 дней, последние заказы
- Курсы: создание, редактирование, публикация, удаление
- Уроки: добавление, редактирование, перестановка порядка, превью-доступ
- Пользователи: поиск, роли, ручная выдача и отзыв доступа к курсам
- Заказы: фильтры по статусу, ручное подтверждение и отмена

---

## Быстрый старт (Windows, PowerShell)

Есть скрипт, который делает шаги 2, 4 и 5 за вас:

```powershell
cd D:\клод\курсы\eduflow
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

Он поставит зависимости, создаст `.env` со сгенерированным `AUTH_SECRET`
и откроет его в блокноте — останется вписать `DATABASE_URL` (см. шаг 3),
после чего запустить скрипт ещё раз: он создаст таблицы и зальёт демо-данные.

Ниже — то же самое вручную. Все команды выполняются в PowerShell из папки
проекта:

```powershell
cd D:\клод\курсы\eduflow
```

### 1. Node.js

Нужен Node.js 18.18+ (лучше LTS 20 или 22) — https://nodejs.org
Проверка:

```powershell
node -v
npm -v
```

### 2. Зависимости

```powershell
npm install
```

### 3. База данных PostgreSQL

Выберите любой вариант — проект одинаково работает со всеми.

**Вариант А. Бесплатный облачный Postgres (проще всего, ничего не ставить)**

Зарегистрируйтесь на https://neon.tech (или https://supabase.com), создайте
проект и скопируйте строку подключения вида
`postgresql://user:pass@host/db?sslmode=require` — её и положите в `DATABASE_URL`.

**Вариант Б. Установить Postgres локально**

Скачайте установщик с https://www.postgresql.org/download/windows/,
при установке задайте пароль пользователя `postgres`, порт оставьте 5432.
Затем создайте базу:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres eduflow
```

Строка подключения: `postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/eduflow?schema=public`

**Вариант В. Docker Desktop**

```powershell
docker run --name eduflow-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eduflow -p 5432:5432 -d postgres:16
```

### 4. Переменные окружения

```powershell
Copy-Item .env.example .env
notepad .env
```

Заполните `DATABASE_URL` и `AUTH_SECRET`. Секрет можно сгенерировать так:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

`PAYMENT_MODE=mock` уже стоит по умолчанию — ключи ЮKassa для локального
запуска не нужны.

### 5. Схема и демо-данные

```powershell
npm run db:push     # создать таблицы
npm run db:seed     # 4 курса, уроки, админ и студент
```

### 6. Запуск

```powershell
npm run dev
```

Откройте http://localhost:3000

**Демо-доступы после сида:**

| Роль | E-mail | Пароль |
| --- | --- | --- |
| Администратор | `admin@eduflow.ru` | `admin12345` |
| Студент | `student@eduflow.ru` | `student12345` |

---

## Подключение реальной ЮKassa

1. Зарегистрируйте магазин в ЮKassa и возьмите **shopId** и **секретный ключ**
   (для тестов подойдёт тестовый магазин).
2. В `.env`:

```env
PAYMENT_MODE="yookassa"
YOOKASSA_SHOP_ID="123456"
YOOKASSA_SECRET_KEY="test_xxxxxxxxxxxxxxxxx"
APP_URL="https://ваш-домен"
```

3. В личном кабинете ЮKassa → **HTTP-уведомления** укажите адрес вебхука:

```
https://ваш-домен/api/payments/webhook
```

и включите события `payment.succeeded` и `payment.canceled`.

4. Для локальной разработки вебхук удобно пробросить через туннель:

```powershell
npx localtunnel --port 3000
# или: ngrok http 3000
```

Полученный https-адрес туннеля укажите и в `APP_URL`, и в настройках
HTTP-уведомлений ЮKassa.

Тело уведомления от ЮKassa не подписывается, поэтому приложение **перепроверяет
статус платежа отдельным запросом к API** — подделать уведомление не получится.
Дополнительно на странице возврата статус запрашивается напрямую, если вебхук
ещё не дошёл.

Тестовые карты ЮKassa: `5555 5555 5555 4477`, любой будущий срок, CVC любой.

---

## Структура проекта

```
prisma/
  schema.prisma          модели: User, Course, Lesson, Enrollment, LessonProgress, Order
  seed.ts                демо-данные
src/
  middleware.ts          защита /dashboard, /learn, /checkout, /admin
  lib/
    prisma.ts            singleton Prisma Client
    jwt.ts               подпись и проверка сессии (edge-совместимо)
    auth.ts              пароли, cookie-сессия, requireUser / requireAdmin
    payments.ts          ЮKassa API + mock-режим, тарифы подписки
    orders.ts            выдача доступа, проверка прав на курс
    courses.ts           выборки для каталога
    format.ts            цены, даты, склонения, slug
  actions/               серверные действия: auth, checkout, learning, admin
  components/            шапка, подвал, карточка курса, плеер, формы
  app/
    page.tsx             лендинг
    courses/             каталог и страница курса
    pricing/             тарифы подписки
    login/ register/     аутентификация
    dashboard/           личный кабинет
    learn/[slug]/        просмотр уроков и прогресс
    checkout/[orderId]/  оплата и страница результата
    admin/               админка
    api/payments/webhook вебхук ЮKassa
```

## Полезные команды

```powershell
npm run dev         # разработка
npm run build       # продакшен-сборка
npm run start       # запуск собранного приложения
npm run typecheck   # проверка типов
npm run db:studio   # визуальный просмотр базы
```

## Если что-то пошло не так (Windows)

| Симптом | Что делать |
| --- | --- |
| `npm : Выполнение сценариев отключено в этой системе` | Запустить один раз в PowerShell от админа: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `Can't reach database server at localhost:5432` | Служба Postgres не запущена: `Get-Service postgresql*` → `Start-Service postgresql-x64-16` |
| `Environment variable not found: DATABASE_URL` | Файл называется `.env` (не `.env.txt`) и лежит в корне проекта |
| `AUTH_SECRET не задан` | Заполнить `AUTH_SECRET` в `.env` и перезапустить `npm run dev` |
| Порт 3000 занят | `npm run dev -- -p 3001` |
| Кракозябры в консоли вместо русского | В PowerShell: `chcp 65001` |
| `В строке отсутствует завершающий символ` при запуске `.ps1` | Файл должен быть в UTF-8 **с BOM** — Windows PowerShell 5.1 иначе читает его как ANSI. В VS Code: правый нижний угол → кодировка → *Save with Encoding* → *UTF-8 with BOM* |

## Деплой

Проект без изменений разворачивается на Vercel / Railway / любом Node-хостинге.
Нужно задать те же переменные окружения, выполнить `prisma migrate deploy`
(или `db push`) и указать боевой `APP_URL` в настройках вебхука ЮKassa.

---

Проект написан как демонстрационный: акцент на понятной архитектуре,
безопасной работе с платежами и аккуратном UI.
