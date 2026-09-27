import api from '../infrastructure/api/api-client';
import { getStoreCode } from '../infrastructure/api/session';

export async function getAvailableTanks(): Promise<{ tankId: string; gradeName: string }[]> {
  const { data } = await api.get('/tanks/available', {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}

export async function getTankMeasurements(date: string, shiftNo: string): Promise<any[]> {
  const { data } = await api.get('/tanks/measurements', {
    headers: { 'x-store-code': getStoreCode() },
    params: { date, shiftNo },
  });
  return data;
}

export async function saveTankMeasurement(payload: {
  shiftDate: string;
  shiftNo: string;
  tankId: string;
  measureType: string;
  height: number;
  volume: number;
  waterLevel: number;
  temperature: number;
}) {
  const { data } = await api.post('/tanks/measurements', payload, {
    headers: { 'x-store-code': getStoreCode() },
  });
  return data;
}
