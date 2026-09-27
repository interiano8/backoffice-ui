import { create } from 'zustand';
import type { DocumentHeader, PaginatedResponse } from '../types/api';
import { getRecentDocuments, searchCustomers as searchCustomersApi, getChargeMethods as getChargeMethodsApi, updateDocument as updateDocumentApi } from '../services/doc.service';

interface DocFilters {
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  docNo?: string;
  customerName?: string;
  docType?: string;
  staff?: string;
  posTerminal?: string;
  shiftId?: string;
}

interface DocState {
  getDocuments: (filters?: DocFilters) => Promise<PaginatedResponse<DocumentHeader>>;
  searchCustomers: (search: string) => Promise<{ customerNo: string; customerName: string; rtn: string; usualBillingType?: number; blocked?: number }[]>;
  getChargeMethods: () => Promise<{ code: string; description: string }[]>;
  updateDocument: (transactionId: string, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
}

export const useDocStore = create<DocState>(() => {
  let chargeMethodsCache: { code: string; description: string }[] | null = null;
  let chargeMethodsPromise: Promise<{ code: string; description: string }[]> | null = null;

  return {
  getDocuments: async (filters = {}) => {
    try {
      return await getRecentDocuments(filters as any) || { data: [], total: 0 };
    } catch {
      return { data: [], total: 0 };
    }
  },

  searchCustomers: async (search: string) => {
    try {
      return await searchCustomersApi(search) || [];
    } catch {
      return [];
    }
  },

  getChargeMethods: async () => {
    if (chargeMethodsCache) return chargeMethodsCache;
    if (chargeMethodsPromise) return chargeMethodsPromise;
    chargeMethodsPromise = (async () => {
      try {
        chargeMethodsCache = await getChargeMethodsApi() || [];
      } catch {
        chargeMethodsCache = [];
      }
      return chargeMethodsCache;
    })();
    return chargeMethodsPromise;
  },

  updateDocument: async (transactionId, data) => {
    try {
      return await updateDocumentApi(transactionId, data);
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Error al actualizar documento' };
    }
  },
}});
