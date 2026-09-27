import { GALLON_TO_LITER } from '@/lib/constants';

const PRODUCT_COLORS: Record<string, string> = {
  'GAS. REGULAR': '#f97316', 'REGULAR': '#f97316',
  'GAS. SUPER': '#a855f7', 'SUPER': '#a855f7',
  'DIESEL': '#22c55e', 'DIESEL 2': '#06b6d4', 'DIESEL2': '#06b6d4',
};

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];

export function getProductColor(name: string, index: number): string {
  const upper = name.toUpperCase().trim();
  if (PRODUCT_COLORS[upper]) return PRODUCT_COLORS[upper];
  for (const key in PRODUCT_COLORS) {
    if (upper.includes(key)) return PRODUCT_COLORS[key];
  }
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function getDefaultColor(index: number): string {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function toGallons(day: any): any {
  const converted: any = { date: day.date };
  Object.keys(day).forEach(key => {
    if (key !== 'date') converted[key] = (day[key] || 0) / GALLON_TO_LITER;
  });
  return converted;
}

export function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((acc, item) => acc + fn(item), 0);
}
