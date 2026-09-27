import api from '../infrastructure/api/api-client';
import { getStoreCode } from '../infrastructure/api/session';

export async function syncSales(reconcilerShiftId?: string | null) {
  const { data } = await api.post('/etl/sync', { reconcilerShiftId }, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}

export async function syncMultipleShifts(reconcilerShiftIds: string[]) {
  const { data } = await api.post('/etl/sync', { reconcilerShiftIds }, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}

