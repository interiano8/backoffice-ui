import api from '../infrastructure/api/api-client';
import { getStoreCode } from '../infrastructure/api/session';
import type { DocumentHeader, Customer, PaginatedResponse } from '../types/api';

export interface DocFilters {
  startDate?: string;
  endDate?: string;
  shiftId?: string;
  docNo?: string;
  customerName?: string;
  docType?: number;
  staff?: string;
  posTerminal?: string;
  page?: number;
  limit?: number;
}

export interface LealFilters {
  startShiftDate: string;
  endShiftDate: string;
  lealType?: string;
  page?: number;
  limit?: number;
}

export async function getRecentDocuments(filters: DocFilters): Promise<PaginatedResponse<DocumentHeader>> {
  const cleanParams: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
    }
  }
  const { data } = await api.get('/documents', {
    headers: { 'x-store-code': getStoreCode() }, params: cleanParams,
  });
  return data;
}

export async function getLealDocuments(filters: LealFilters): Promise<PaginatedResponse<DocumentHeader>> {
  const cleanParams: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
    }
  }
  const { data } = await api.get('/documents/leal', {
    headers: { 'x-store-code': getStoreCode() }, params: cleanParams,
  });
  return data;
}

export async function searchCustomers(search: string): Promise<Customer[]> {
  const { data } = await api.get('/documents/customers', {
    headers: { 'x-store-code': getStoreCode() }, params: { search },
  });
  return data;
}

export async function getChargeMethods(): Promise<{ code: string; description: string }[]> {
  const { data } = await api.get('/documents/charge-methods', { headers: { 'x-store-code': getStoreCode() } });
  return data;
}

export async function updateDocument(transactionId: string, payload: any) {
  const { data } = await api.patch(`/documents/${transactionId}`, payload, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}

export async function getPosCodes(): Promise<string[]> {
  const { data } = await api.get('/documents/pos-codes', { headers: { 'x-store-code': getStoreCode() } });
  return data;
}

export async function getUsers(): Promise<string[]> {
  const { data } = await api.get('/documents/users', { headers: { 'x-store-code': getStoreCode() } });
  return data;
}

export async function getShiftCount(): Promise<number> {
  const { data } = await api.get('/documents/shift-count', { headers: { 'x-store-code': getStoreCode() } });
  return data;
}
