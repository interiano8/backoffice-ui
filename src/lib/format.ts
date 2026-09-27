export function formatShiftDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatCurrency(value: number | undefined | null, prefix: string = 'L. '): string {
  return `${prefix}${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function formatNumber(value: number | undefined | null, decimals: number = 2): string {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatDateUTC(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-CA');
}

export function formatNumberInput(value: string): string {
  return value.replace(/[^0-9.+\-]/g, '');
}

export function formatIntInput(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (!str) return 0;
  if (str.includes('+') || str.includes('-')) {
    try {
      const tokens = str.split(/([+\-])/).filter(Boolean);
      let result = 0;
      let op = '+';
      for (const token of tokens) {
        if (token === '+') op = '+';
        else if (token === '-') op = '-';
        else {
          const num = parseFloat(token.replace(/[^0-9.]/g, '')) || 0;
          result = op === '+' ? result + num : result - num;
        }
      }
      return result;
    } catch { return 0; }
  }
  return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
}

export function formatTimeLiteral(time: string | undefined | null): string {
  if (!time) return '-';
  // Handle raw time strings like "06:13:07.830"
  if (time.includes(' ') || time.includes('T')) {
    const timePart = time.includes(' ') ? time.split(' ')[1] : time.split('T')[1];
    return timePart ? timePart.split('.')[0].substring(0, 8) : '-';
  }
  // Handle date objects or ISO strings
  const d = new Date(time);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return time.substring(0, 8);
}

export function formatDateTimeLiteral(dt: string | undefined | null): string {
  if (!dt) return '-';
  // Handle strings with both date and time
  if (dt.includes(' ') || dt.includes('T')) {
    const [datePart, timePart] = dt.includes(' ') ? dt.split(' ') : dt.split('T');
    const time = (timePart || '').split('.')[0].substring(0, 8);
    if (dt.includes('T')) {
      const d = new Date(dt);
      if (!isNaN(d.getTime())) {
        return `${d.toLocaleDateString('es-HN')} ${d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
      }
    }
    return `${datePart} ${time}`;
  }
  const d = new Date(dt);
  if (!isNaN(d.getTime())) {
    return `${d.toLocaleDateString('es-HN')} ${d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
  }
  return dt;
}
