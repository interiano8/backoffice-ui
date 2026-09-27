import { create } from 'zustand';
import type { Customer, PaginatedResponse } from '../types/api';
import { getCustomers as getCustomersApi, getCustomer as getCustomerApi, updateCustomer as updateCustomerApi, toggleCustomerStatus as toggleCustomerStatusApi } from '../services/customer.service';

interface CustomerFilters {
  search?: string;
  billingType?: string;
  page?: number;
  limit?: number;
}

interface CustomerState {
  getCustomers: (filters?: CustomerFilters) => Promise<PaginatedResponse<Customer>>;
  getCustomer: (customerNo: string) => Promise<Customer | null>;
  updateCustomer: (customerNo: string, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  toggleCustomerStatus: (customerNo: string) => Promise<{ success: boolean; error?: string; blocked?: boolean }>;
}

export const useCustomerStore = create<CustomerState>(() => ({
  getCustomers: async (filters = {}) => {
    try {
      return await getCustomersApi(filters) || { data: [], total: 0 };
    } catch {
      return { data: [], total: 0 };
    }
  },

  getCustomer: async (customerNo: string) => {
    try {
      return await getCustomerApi(customerNo) || null;
    } catch {
      return null;
    }
  },

  updateCustomer: async (customerNo, data) => {
    try {
      return await updateCustomerApi(customerNo, data);
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Error al actualizar cliente' };
    }
  },

  toggleCustomerStatus: async (customerNo) => {
    try {
      return await toggleCustomerStatusApi(customerNo);
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Error al cambiar estado del cliente' };
    }
  },
}));
