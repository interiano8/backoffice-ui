import { describe, it, expect } from 'vitest';
import {
  formatShiftDate,
  formatCurrency,
  formatNumber,
  formatDateUTC,
  formatNumberInput,
  formatIntInput,
  parseCurrency,
  formatTimeLiteral,
  formatDateTimeLiteral,
} from './format';

describe('format utilities comprehensive tests', () => {
  it('formatShiftDate handles valid and invalid inputs', () => {
    expect(formatShiftDate('2026-08-31T12:00:00Z')).toBe('31/08/2026');
    expect(formatShiftDate(null)).toBe('');
    expect(formatShiftDate(undefined)).toBe('');
    expect(formatShiftDate('invalid-date')).toBe('');
  });

  it('formatCurrency formats values properly', () => {
    expect(formatCurrency(1234.56)).toBe('L. 1,234.56');
    expect(formatCurrency('1234.56' as any, '$ ')).toBe('$ 1,234.56');
    expect(formatCurrency(null)).toBe('L. 0.00');
    expect(formatCurrency(undefined)).toBe('L. 0.00');
    expect(formatCurrency(0)).toBe('L. 0.00');
  });

  it('formatNumber formats numbers with precision', () => {
    expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
    expect(formatNumber(null)).toBe('0.00');
    expect(formatNumber(undefined)).toBe('0.00');
  });

  it('formatDateUTC returns YYYY-MM-DD format', () => {
    expect(formatDateUTC('2026-08-31T12:00:00Z')).toBe('2026-08-31');
    expect(formatDateUTC(null)).toBe('');
    expect(formatDateUTC(undefined)).toBe('');
  });

  it('formatNumberInput and formatIntInput clean strings', () => {
    expect(formatNumberInput('12.34.56-')).toBe('12.34.56-');
    expect(formatNumberInput('abc 123')).toBe('123');
    expect(formatIntInput('123.456abc')).toBe('123456');
  });

  it('parseCurrency parses single numbers, strings, and expressions', () => {
    expect(parseCurrency(1234.56)).toBe(1234.56);
    expect(parseCurrency('1,234.56')).toBe(1234.56);
    expect(parseCurrency('500 + 200 - 100')).toBe(600);
    expect(parseCurrency('')).toBe(0);
    expect(parseCurrency('invalid')).toBe(0);
  });

  it('formatTimeLiteral formats time strings', () => {
    expect(formatTimeLiteral(null)).toBe('-');
    expect(formatTimeLiteral('2026-08-31 06:13:07.830')).toBe('06:13:07');
    expect(formatTimeLiteral('2026-08-31T06:13:07.830Z')).toBe('06:13:07');
  });

  it('formatDateTimeLiteral formats datetime strings', () => {
    expect(formatDateTimeLiteral(null)).toBe('-');
    expect(formatDateTimeLiteral('2026-08-31 06:13:07.830')).toBe('2026-08-31 06:13:07');
    expect(formatDateTimeLiteral('2026-08-31T06:13:07.830Z')).toContain('2026');
  });
});
