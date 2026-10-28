import type { Category } from './types';

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value));

export const formatMoney = (value: number, withSign = false): string => {
  const formatted = formatNumber(Math.abs(value));
  if (value < 0) return `−${formatted} ₽`;
  if (withSign && value > 0) return `+${formatted} ₽`;
  return `${formatted} ₽`;
};

export const formatCompact = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')} млн ₽`;
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 1000)} тыс. ₽`;
  return formatMoney(value);
};

export const plural = (value: number, one: string, few: string, many: string): string => {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

export const monthLabel = (offset = 0, short = false): string => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  const label = new Intl.DateTimeFormat('ru-RU', {
    month: short ? 'short' : 'long',
    year: 'numeric',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
};

export const monthShort = (offset = 0): string => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(date).replace('.', '');
};

export const dateShort = (iso: string): string => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
    .format(date)
    .replace('.', '');
};

export const relativeDay = (iso: string): string => {
  const date = new Date(iso);
  const today = new Date();
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((a - b) / 86_400_000);
  if (diff === 0) return 'Сегодня';
  if (diff === -1) return 'Вчера';
  if (diff === 1) return 'Завтра';
  if (diff > 1 && diff < 7) return `Через ${diff} ${plural(diff, 'день', 'дня', 'дней')}`;
  return dateShort(iso);
};

export const deadlineLabel = (iso: string): string => {
  const date = new Date(iso);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'Срок истёк';
  if (days < 31) return `${days} ${plural(days, 'день', 'дня', 'дней')} до цели`;
  const months = Math.round(days / 30);
  return `${months} ${plural(months, 'месяц', 'месяца', 'месяцев')} до цели`;
};

export const isInMonth = (iso: string, offset: number): boolean => {
  const date = new Date(iso);
  const target = new Date();
  target.setDate(1);
  target.setMonth(target.getMonth() + offset);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
};

export const categorySpentForMonth = (category: Category, offset: number): number => {
  if (offset === 0) return category.spent;
  if (offset === 1) return category.lastMonth;
  return Math.round(category.lastMonth * 0.91);
};

export const monthIncome = (base: number, offset: number): number => {
  if (offset === 0) return base;
  if (offset === 1) return 228_000;
  return 219_500;
};

export interface LevelInfo {
  level: number;
  title: string;
  nextTitle: string | null;
  min: number;
  nextMin: number | null;
  progress: number;
}

const LEVELS = [
  { level: 1, title: 'Новичок', min: 0 },
  { level: 2, title: 'Копилкин', min: 200 },
  { level: 3, title: 'Финансовый детектив', min: 600 },
  { level: 4, title: 'Мастер бюджета', min: 1_200 },
  { level: 5, title: 'Гуру искр', min: 2_000 },
  { level: 6, title: 'Легенда Семьи+', min: 3_000 },
];

export const getLevel = (xp: number): LevelInfo => {
  let current = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = null;
  for (const level of LEVELS) {
    if (xp >= level.min) current = level;
    else {
      next = level;
      break;
    }
  }
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return {
    level: current.level,
    title: current.title,
    nextTitle: next?.title ?? null,
    min: current.min,
    nextMin: next?.min ?? null,
    progress: Math.max(0, Math.min(1, progress)),
  };
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export const percent = (value: number, total: number): number =>
  total <= 0 ? 0 : Math.max(0, Math.min(100, (value / total) * 100));

export const greeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

export const formatDateLong = (): string => {
  const label = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
};
