export const DOC_TYPE = {
  INVOICE_CASH: 1,
  INVOICE_CREDIT: 2,
  CREDIT_NOTE: 3,
  TICKET: 7,
  OUTFLOW: 99,
} as const;

export const DOC_TYPE_LABELS: Record<number, string> = {
  [DOC_TYPE.INVOICE_CASH]: 'Factura (Contado)',
  [DOC_TYPE.INVOICE_CREDIT]: 'Factura (Credito)',
  [DOC_TYPE.CREDIT_NOTE]: 'Nota de Credito',
  [DOC_TYPE.TICKET]: 'Ticket',
  [DOC_TYPE.OUTFLOW]: 'Vale/Salida',
};

export function getDocTypeLabel(type: number): string {
  return DOC_TYPE_LABELS[type] || 'Documento';
}

export const PAYMENT_CATEGORIES = {
  EFECTIVO: 'EFECTIVO',
  CASH: 'CASH',
  CREDITO: 'CREDITO',
  CREDIT: 'CREDIT',
  TRANSFERENCIA: 'TRANSFERENCIA',
  TARJETA: 'TARJETA',
  CARD: 'CARD',
} as const;

export function normalizePaymentName(name: any): string {
  return String(name || '').toUpperCase().trim();
}

export function isEfectivo(name: string): boolean {
  const n = normalizePaymentName(name);
  return n === PAYMENT_CATEGORIES.EFECTIVO || n === PAYMENT_CATEGORIES.CASH || n.includes('EFECTIVO');
}

export function isCredito(name: string): boolean {
  const n = normalizePaymentName(name);
  return n === PAYMENT_CATEGORIES.CREDITO || n === PAYMENT_CATEGORIES.CREDIT ||
    (n.includes('CREDITO') && !n.includes('TC') && !n.includes('TARJETA') && !n.includes('CARD'));
}

export function isTarjeta(name: string): boolean {
  const n = normalizePaymentName(name);
  return n.startsWith('TC') || n.includes('ATLANTID') || (n.includes('TARJETA') && !n.includes('CREDITO'));
}

export function isTransferencia(name: string): boolean {
  const n = normalizePaymentName(name);
  return n === PAYMENT_CATEGORIES.TRANSFERENCIA || n.includes('TRANSFERENCIA');
}

export function isAplicacion(name: string): boolean {
  const n = normalizePaymentName(name);
  return n.includes('APLICACION') || n.includes('APP') || n.includes('PAGO POR');
}

export const GALLON_TO_LITER = 3.78541;
export const LITER_TO_GALLON = 1 / 3.78541;
