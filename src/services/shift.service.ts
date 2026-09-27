import api from '../infrastructure/api/api-client';
import { getStoreCode } from '../infrastructure/api/session';
import type {
  Shift, DocumentHeader, PaymentMethod, FusionData, UnifiedData,
} from '../types/api';

export async function getShifts(date?: string, status?: string): Promise<Shift[]> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (status) params.status = status;
  const { data } = await api.get('/shifts', { headers: { 'x-store-code': getStoreCode() }, params });
  return data;
}

export async function getShiftDetails(date: string, shiftNo: string, attendantName?: string): Promise<{
  fuel: any[]; products: any[]; paymentMethods: PaymentMethod[];
  documents: { invoicesCash: DocumentHeader[]; invoicesCredit: DocumentHeader[]; creditNotes: DocumentHeader[]; outflows: DocumentHeader[] };
  counters: any; totalTaxes: number; tickets: any[];
}> {
  const params: Record<string, string> = { date, shiftNo };
  if (attendantName) params.attendantName = attendantName;
  const { data } = await api.get(`/shifts/${date}/${shiftNo}`, {
    headers: { 'x-store-code': getStoreCode() }, params,
  });
  return data;
}

export async function getUniqueDates(): Promise<string[]> {
  const { data } = await api.get('/shifts/dates', { headers: { 'x-store-code': getStoreCode() } });
  return data;
}

export async function getAvailableDates(limit?: number): Promise<string[]> {
  const { data } = await api.get('/shifts/available-dates', {
    headers: { 'x-store-code': getStoreCode() }, params: { ...(limit ? { limit: String(limit) } : {}) },
  });
  return data;
}

export async function getShiftsByDate(date: string): Promise<any[]> {
  const { data } = await api.get(`/shifts/by-date/${date}`, { headers: { 'x-store-code': getStoreCode() } });
  return data;
}

export async function getFusionDetails(fsShiftIds: string): Promise<FusionData> {
  const { data } = await api.get('/shifts/fusion-details', {
    headers: { 'x-store-code': getStoreCode() }, params: { fsShiftIds },
  });
  return data;
}

export async function getUnifiedPayments(fsShiftIds: string): Promise<UnifiedData> {
  const { data } = await api.get('/shifts/unified-payments', {
    headers: { 'x-store-code': getStoreCode() }, params: { fsShiftIds },
  });
  return data;
}

export async function getUnifiedProducts(fsShiftIds: string): Promise<any> {
  const { data } = await api.get('/shifts/unified-products', {
    headers: { 'x-store-code': getStoreCode() }, params: { fsShiftIds },
  });
  return data;
}

export async function getPresentationExpected(shiftDate: string, shiftNo: string, employeeName: string) {
  const { data } = await api.post('/shifts/presentation-expected', { shiftDate, shiftNo, employeeName }, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}

export async function savePresentation(payload: any) {
  const { data } = await api.post('/shifts/presentation', payload, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}

export async function printShiftReport(payload: any) {
  const { data } = await api.post('/shifts/print-report', payload, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}
