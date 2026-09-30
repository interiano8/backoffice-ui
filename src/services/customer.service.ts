import api from '../infrastructure/api/api-client';
import { getStoreCode } from '../infrastructure/api/session';
import type { Customer, PaginatedResponse } from '../types/api';

export interface CustomerFilters {
  search?: string;
  billingType?: string;
  page?: number;
  limit?: number;
}

export async function getCustomers(filters: CustomerFilters): Promise<PaginatedResponse<Customer> & { page: number; limit: number }> {
  const { data } = await api.get('/customers', {
    headers: { 'x-store-code': getStoreCode() }, params: filters,
  });
  return data;
}

export async function getCustomer(customerNo: string): Promise<Customer> {
  const { data } = await api.get(`/customers/${customerNo}`, { headers: { 'x-store-code': getStoreCode() } });
  return data;
}

export async function getNextCustomerCode(billingType: number): Promise<{ customerNo: string }> {
  const { data } = await api.get('/customers/next-code', {
    headers: { 'x-store-code': getStoreCode() },
    params: { billingType },
  });
  return data;
}

export async function createCustomer(payload: {
  customerNo?: string;
  customerName: string;
  rtn?: string;
  billingType: number;
  creditLimit?: number;
  notes?: string;
}) {
  const { data } = await api.post('/customers', payload, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}

export async function updateCustomer(customerNo: string, payload: any) {
  const { data } = await api.patch(`/customers/${customerNo}`, payload, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}

export async function toggleCustomerStatus(customerNo: string) {
  const { data } = await api.patch(`/customers/${customerNo}/toggle-status`, {}, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}
