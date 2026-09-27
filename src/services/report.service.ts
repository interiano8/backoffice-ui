import api from '../infrastructure/api/api-client';
import { getStoreCode } from '../infrastructure/api/session';
import type { DashboardData, MonthlyData, CustomerStatement } from '../types/api';

export async function getDashboardStats(days?: number, date?: string, startDate?: string, endDate?: string): Promise<DashboardData> {
  const params: Record<string, string> = {};
  if (days) params.days = String(days);
  if (date) params.date = date;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await api.get('/reports/dashboard-stats', {
    headers: { 'x-store-code': getStoreCode() }, params,
  });
  return data;
}

export async function getMonthlyAnalysis(startDate1: string, endDate1: string, startDate2: string, endDate2: string): Promise<MonthlyData> {
  const { data } = await api.get('/reports/monthly-analysis', {
    headers: { 'x-store-code': getStoreCode() },
    params: { startDate1, endDate1, startDate2, endDate2 },
  });
  return data;
}

export async function getActiveCustomers(startDate: string, endDate: string): Promise<any[]> {
  const { data } = await api.get('/reports/active-customers', {
    headers: { 'x-store-code': getStoreCode() }, params: { startDate, endDate },
  });
  return data;
}

export async function getCustomerStatement(startDate: string, endDate: string, customerNo: string): Promise<CustomerStatement[]> {
  const { data } = await api.get('/reports/customer-statement', {
    headers: { 'x-store-code': getStoreCode() },
    params: { startDate, endDate, customerNo },
  });
  return data;
}

export async function getSalesDeclaration(startDate: string, endDate: string, type: 'resumido' | 'detallado'): Promise<any[]> {
  const { data } = await api.get('/reports/sales-declaration', {
    headers: { 'x-store-code': getStoreCode() },
    params: { startDate, endDate, type },
  });
  return data;
}

export async function getBulkCustomerStatements(startDate: string, endDate: string): Promise<Record<string, any[]>> {
  const { data } = await api.get('/reports/bulk-customer-statements', {
    headers: { 'x-store-code': getStoreCode() }, params: { startDate, endDate },
  });
  return data;
}
