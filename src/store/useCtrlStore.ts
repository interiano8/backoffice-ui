import { create } from 'zustand';
import { getRecentSales, getShiftValidation } from '../services/ctrl.service';

interface CtrlFilters {
  shiftId?: string;
  startDate?: string;
  endDate?: string;
  saleId?: string;
  posNumber?: string;
  pumpNumber?: string;
  minAmount?: string;
  maxAmount?: string;
}

interface CtrlSale {
  SaleID: number;
  PosNumber: number;
  PumpNumber: number;
  HoseNumber: number;
  Amount: number;
  PPU: number;
  Volume: number;
  ShiftID: number;
  productName: string;
  formattedDateTime: string;
  displayPos: number | string;
}

interface CtrlShiftValidation {
  netSales: number;
  discounts: number;
  creditNotes: number;
  tickets: number;
  grossSales: number;
  calculatedTotal: number;
}

interface CtrlState {
  getCtrlSales: (filters?: CtrlFilters) => Promise<CtrlSale[]>;
  getCtrlShiftValidation: (shiftId: string) => Promise<CtrlShiftValidation | null>;
}

export const useCtrlStore = create<CtrlState>(() => ({
  getCtrlSales: async (filters = {}) => {
    try {
      return await getRecentSales(filters) || [];
    } catch {
      return [];
    }
  },

  getCtrlShiftValidation: async (shiftId: string) => {
    try {
      if (!shiftId) return null;
      return await getShiftValidation(shiftId) || null;
    } catch {
      return null;
    }
  },
}));
