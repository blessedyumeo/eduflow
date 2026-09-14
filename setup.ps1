# Первичная настройка проекта на Windows.
# Запуск из папки проекта:  powershell -ExecutionPolicy Bypass -File .\setup.ps1

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

# Чтобы русский текст в консоли не превращался в кракозябры
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

Write-Host ""
Write-Host "=== EduFlow: настройка ===" -ForegroundColor Cyan
Write-Host ""

# --- 1. Node.js ---
try {
    $nodeVersion = (node -v)
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js не найден. Установите LTS с https://nodejs.org и запустите скрипт снова." -ForegroundColor Red
    exit 1
}

# --- 2. Зависимости ---
Write-Host ""
Write-Host "[1/4] Устанавливаю зависимости (пара минут)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install завершился с ошибкой. Скопируйте текст выше и покажите его." -ForegroundColor Red
    exit 1
}

# --- 3. Файл .env ---
if (-Not (Test-Path '.env')) {
    Write-Host ""
    Write-Host "[2/4] Создаю .env из .env.example..." -ForegroundColor Cyan

    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $envPath = Join-Path $PSScriptRoot '.env'
    $examplePath = Join-Path $PSScriptRoot '.env.example'

    $content = [System.IO.File]::ReadAllText($examplePath, [System.Text.Encoding]::UTF8)
    $content = $content -replace 'AUTH_SECRET="[^"]*"', ('AUTH_SECRET="' + $secret + '"')
    [System.IO.File]::WriteAllText($envPath, $content, $utf8NoBom)

    Write-Host "AUTH_SECRET сгенерирован автоматически." -ForegroundColor Green
    Write-Host ""
    Write-Host "Осталось указать DATABASE_URL — строку подключения к PostgreSQL." -ForegroundColor Yellow
    Write-Host "Сейчас откроется блокнот: впишите её, сохраните (Ctrl+S) и закройте." -ForegroundColor Yellow
    Write-Host "Затем запустите этот скрипт ещё раз." -ForegroundColor Yellow
    Write-Host ""

    Start-Process notepad.exe -ArgumentList $envPath
    exit 0
} else {
    Write-Host ""
    Write-Host "[2/4] Файл .env уже есть, пропускаю." -ForegroundColor Green
}

# --- 4. Схема базы ---
Write-Host ""
Write-Host "[3/4] Создаю таблицы в базе..." -ForegroundColor Cyan
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Не удалось подключиться к базе. Проверьте DATABASE_URL в файле .env." -ForegroundColor Red
    exit 1
}

# --- 5. Демо-данные ---
Write-Host ""
Write-Host "[4/4] Заливаю демо-курсы и аккаунты..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Сид не отработал. Покажите текст ошибки выше." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Готово. Запускайте: npm run dev   ->   http://localhost:3000" -ForegroundColor Green
Write-Host "Админ:   admin@eduflow.ru / admin12345"
Write-Host "Студент: student@eduflow.ru / student12345"
Write-Host ""
