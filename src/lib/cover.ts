import type { CSSProperties } from 'react';

export const DEFAULT_COVER = 'linear-gradient(135deg,#1f5ad6,#5ce2b4)';

/**
 * Поле `cover` у курса принимает три вида значения:
 *   1. путь к файлу в /public — «/covers/react.svg»
 *   2. внешний URL картинки — «https://…/photo.jpg»
 *   3. любой CSS-фон — «linear-gradient(135deg,#1f5ad6,#5ce2b4)» или «#1f5ad6»
 * Функция превращает его в готовые inline-стили.
 */
export function coverStyle(cover?: string | null): CSSProperties {
  const value = (cover ?? '').trim();

  if (!value) {
    return { background: DEFAULT_COVER };
  }

  const isImage =
    value.startsWith('/') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:image');

  if (isImage) {
    return {
      backgroundImage: `url("${value.replace(/"/g, '%22')}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }

  return { background: value };
}
