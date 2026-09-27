import { create } from 'zustand';
import { toast } from 'sonner';
import type { Shift } from '../types/api';
import { getShifts as getShiftsApi, getShiftsByDate, getAvailableDates as getAvailableDatesApi } from '../services/shift.service';
import { syncSales as syncSalesApi } from '../services/sync.service';

interface ShiftState {
  shifts: Shift[];
  availableDates: string[];
  loading: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  getShifts: (date?: string) => Promise<void>;
  getTpvShifts: (date: string) => Promise<Shift[]>;
  getAvailableDates: () => Promise<void>;
  syncSales: () => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set) => ({
  shifts: [],
  availableDates: [],
  loading: false,
  lastSync: null,
  isSyncing: false,

  getShifts: async (date?: string) => {
    set({ loading: true });
    try {
      const result = await getShiftsApi(date);
      set({ shifts: result || [], loading: false });
    } catch (error: any) {
      console.error('[useShiftStore] Error fetching shifts:', error);
      toast.error('Error al cargar la lista de turnos');
      set({ shifts: [], loading: false });
    }
  },

  getTpvShifts: async (date: string) => {
    try {
      return (await getShiftsByDate(date)) || [];
    } catch (error: any) {
      console.error('[useShiftStore] Error fetching TPV shifts:', error);
      toast.error('Error al cargar turnos desde el TPV');
      return [];
    }
  },

  getAvailableDates: async () => {
    try {
      const result = await getAvailableDatesApi();
      set({ availableDates: result || [] });
    } catch (error: any) {
      console.error('[useShiftStore] Error fetching available dates:', error);
    }
  },

  syncSales: async () => {
    set({ isSyncing: true });
    try {
      const result = await syncSalesApi();
      if (result && result.success) {
        toast.success('Sincronización completada con éxito');
        set({ lastSync: new Date() });
        const state = useShiftStore.getState();
        if (state.getShifts) await state.getShifts();
      } else {
        toast.error(result?.error || 'Error durante la sincronización');
      }
    } catch (error: any) {
      console.error('[useShiftStore] Error syncing sales:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Error al sincronizar ventas');
    } finally {
      set({ isSyncing: false });
    }
  },
}));

