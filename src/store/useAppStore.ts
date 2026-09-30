import { create } from 'zustand';
import { STATIC_STORES } from '../config/stores';
import type { Store } from '../types/api';
import { getAvailableDates as getAvailableDatesApi } from '../services/shift.service';
import api, { getHubURL } from '../infrastructure/api/api-client';

interface AppState {
  user: { username: string; role: string; sub: number; name?: string; usuario?: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  stores: Store[];
  selectedStore: Store | null;
  activeApiUrl: string | null;
  isLocalMode: boolean;
  globalDate: string;
  availableDates: string[];
  setGlobalDate: (date: string) => void;
  getStores: () => Promise<void>;
  setSelectedStore: (store: Store) => void;
  setLocalMode: (isLocal: boolean) => void;
  getAvailableDates: () => Promise<void>;
  refreshStoreConfig: () => Promise<void>;
}

const isLocalHost = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') || hostname.startsWith('172.') ||
    hostname.startsWith('10.') || hostname.endsWith('.local');
};

export const GLOBAL_STORE = {
  id: 'GLOBAL',
  code: 'GLOBAL',
  name: 'TODA LA RED (GLOBAL)',
  titulo: 'BCPOS BACKOFFICE',
  address: '',
  IP: '',
  ip: '127.0.0.1',
  isActive: true,
};

export const useAppStore = create<AppState>((set, get) => ({
  user: (() => { try { const u = sessionStorage.getItem('user'); return u ? JSON.parse(u) : null; } catch { return null; } })(),
  token: sessionStorage.getItem('token'),
  isAuthenticated: !!sessionStorage.getItem('token'),
  stores: [],
  // Por defecto la tienda activa es el HUB (GLOBAL = casa matriz / toda la red).
  // Solo se restaura la tienda que el usuario eligió explícitamente en la sesión.
  selectedStore: (() => {
    try {
      const s = sessionStorage.getItem('selectedStore');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && parsed.code) return parsed;
      }
    } catch { /* sesión corrupta → hub */ }
    return GLOBAL_STORE;
  })(),
  activeApiUrl: (() => {
    try {
      const store = sessionStorage.getItem('selectedStore');
      if (!store) return sessionStorage.getItem('activeApiUrl');
      const parsed = JSON.parse(store);
      return isLocalHost() ? (parsed.lanUrl || parsed.apiUrl) : (parsed.apiUrl || parsed.lanUrl);
    } catch { return null; }
  })(),
  isLocalMode: isLocalHost(),
  globalDate: new Date().toLocaleDateString('en-CA'),
  availableDates: [],

  setGlobalDate: (date: string) => set({ globalDate: date }),

  getStores: async () => {
    try {
      // /stores es endpoint del HUB (matriz), no de la estación activa.
      const hub = getHubURL();
      const { data } = await api.get(`${hub}/stores/public`);
      if (Array.isArray(data) && data.length > 0) {
        const defaultApiUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3089` : 'http://localhost:3089';
        const mappedStores: Store[] = data.map((s: any) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          titulo: s.titulo || s.name,
          RTN: s.RTN || '',
          address: s.address || '',
          ip: s.ip || '127.0.0.1',
          apiUrl: s.apiUrl || defaultApiUrl,
          lanUrl: s.lanUrl || s.apiUrl || defaultApiUrl,
          logoUrl: s.logoUrl || null,
          isActive: s.isActive ?? true,
          moduleCustomers: s.moduleCustomers ?? 1,
          printCreditInvoices: s.printCreditInvoices ?? false,
          SyncMinutes: s.SyncMinutes ?? 300,
          PresentationMinutes: s.PresentationMinutes ?? 30,
        }));

        set({ stores: mappedStores });
        // NO se auto-selecciona la primera tienda: el usuario entra al HUB de la
        // matriz y elige la tienda explícitamente. Solo se refresca la información
        // de la tienda que ya estaba seleccionada manualmente.
        const { selectedStore } = get();
        if (selectedStore) {
          const updated = mappedStores.find((s: Store) => s.code === selectedStore.code || s.id === selectedStore.id);
          if (updated) {
            get().setSelectedStore(updated);
          }
        }
        return;
      }
    } catch {
      // fallback to static stores
    }

    set({ stores: STATIC_STORES });
    return;
  },

  refreshStoreConfig: async () => {
    try {
      // /stores/basic es del hub (matriz), no de la estación.
      const hub = getHubURL();
      const { data } = await api.get(`${hub}/stores/basic`);
      if (!Array.isArray(data)) return;

      const defaultApiUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3089` : 'http://localhost:3089';
      const backendStores: any[] = data;
      const merged: Store[] = backendStores.map((backend: any) => ({
        id: backend.id,
        code: backend.code,
        name: backend.name,
        titulo: backend.titulo || backend.name,
        RTN: backend.RTN || '',
        address: backend.address || '',
        ip: backend.ip || '127.0.0.1',
        apiUrl: backend.apiUrl || defaultApiUrl,
        lanUrl: backend.lanUrl || backend.apiUrl || defaultApiUrl,
        logoUrl: backend.logoUrl || null,
        isActive: backend.isActive ?? true,
        moduleCustomers: backend.moduleCustomers ?? 1,
        printCreditInvoices: backend.printCreditInvoices ?? false,
        SyncMinutes: backend.SyncMinutes ?? 300,
        PresentationMinutes: backend.PresentationMinutes ?? 30,
      }));

      set({ stores: merged });

      const { selectedStore } = get();
      if (selectedStore) {
        const refreshed = merged.find((s: Store) => s.code === selectedStore.code || s.id === selectedStore.id);
        if (refreshed) {
          set({ selectedStore: refreshed });
          sessionStorage.setItem('selectedStore', JSON.stringify(refreshed));
        }
      }
    } catch {
      // fallback
    }
  },

  setSelectedStore: (store: Store | null) => {
    if (!store || store.code === 'GLOBAL' || store.code === '000' || store.id === 'GLOBAL') {
      sessionStorage.removeItem('selectedStore');
      sessionStorage.removeItem('activeApiUrl');
      set({ selectedStore: GLOBAL_STORE, activeApiUrl: null });
      return;
    }
    sessionStorage.setItem('selectedStore', JSON.stringify(store));
    const isLocal = isLocalHost();
    const targetUrl = isLocal ? (store.lanUrl || store.apiUrl) : (store.apiUrl || store.lanUrl);
    if (targetUrl) {
      sessionStorage.setItem('activeApiUrl', targetUrl);
      set({ activeApiUrl: targetUrl, isLocalMode: isLocal });
    } else {
      sessionStorage.removeItem('activeApiUrl');
      set({ activeApiUrl: null });
    }
    set({ selectedStore: store, availableDates: [] });
    const token = sessionStorage.getItem('token');
    if (token) {
      setTimeout(() => get().refreshStoreConfig(), 100);
    }
  },

  setLocalMode: (isLocal: boolean) => {
    set({ isLocalMode: isLocal });
    const { selectedStore } = get();
    if (selectedStore) {
      const newUrl = isLocal ? (selectedStore.lanUrl || selectedStore.apiUrl) : (selectedStore.apiUrl || selectedStore.lanUrl);
      if (newUrl) {
        sessionStorage.setItem('activeApiUrl', newUrl || '');
        set({ activeApiUrl: newUrl });
      }
    }
  },

  getAvailableDates: async () => {
    try {
      const result = await getAvailableDatesApi();
      set({ availableDates: result || [] });
    } catch {
      console.error('[useAppStore] getAvailableDates failed');
    }
  },
}));
