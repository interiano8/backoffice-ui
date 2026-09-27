import { create } from 'zustand';
import api, { getHubURL } from '../infrastructure/api/api-client';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

function loadUser(): User | null {
  try {
    const u = sessionStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  token: sessionStorage.getItem('token'),
  isAuthenticated: !!sessionStorage.getItem('token'),

  login: async (username, password) => {
    try {
      // El login del HUB (matriz) siempre va a la URL de la matriz,
      // independientemente de la tienda que esté seleccionada.
      const hub = getHubURL();
      const response = await api.post(`${hub}/auth/login`, { username, password });
      if (response.data.access_token) {
        const { access_token, user } = response.data;
        sessionStorage.setItem('token', access_token);
        sessionStorage.setItem('user', JSON.stringify(user));
        if (user.usuario) sessionStorage.setItem('Usuario', user.usuario);
        set({ token: access_token, user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('[useAuthStore] login failed:', error);
      if (!error.response) throw new Error('NETWORK_ERROR');
      if (error.response.status === 401) {
        const serverMsg = error.response?.data?.message;
        throw new Error(serverMsg || 'UNAUTHORIZED');
      }
      throw error;
    }
  },

  logout: () => {
    sessionStorage.clear();
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
