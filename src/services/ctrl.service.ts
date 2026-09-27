import api from '../infrastructure/api/api-client';
import { getStoreCode } from '../infrastructure/api/session';

export interface CtrlFilters {
  shiftId?: string;
  startDate?: string;
  endDate?: string;
  posNumber?: string;
  pumpNumber?: string;
  saleId?: string;
  minAmount?: string;
  maxAmount?: string;
}

export async function getRecentSales(filters: CtrlFilters): Promise<any[]> {
  const { data } = await api.get('/ctrl/sales', {
    headers: { 'x-store-code': getStoreCode() }, params: filters,
  });
  return data;
}

export async function getShiftValidation(shiftId: string): Promise<any> {
  const { data } = await api.get(`/ctrl/shift-validation/${shiftId}`, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}
