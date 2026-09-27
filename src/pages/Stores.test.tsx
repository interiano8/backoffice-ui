import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StoresPage } from './Stores';
import api from '../infrastructure/api/api-client';
import { isAdmin, can } from '../services/auth.service';

vi.mock('../infrastructure/api/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: () => ({
    getStores: vi.fn(),
  }),
}));

vi.mock('../services/auth.service', () => ({
  isAdmin: vi.fn(() => true),
  can: vi.fn(() => true),
}));

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: any) =>
    selector ? selector({ user: { username: 'admin', role: 'ADMIN' } }) : { user: { username: 'admin', role: 'ADMIN' } },
}));

describe('StoresPage - Network Health & Sync Dashboard', () => {
  const mockStores = [
    {
      id: 'store-1',
      code: '001',
      name: 'Estación Kennedy',
      ip: 'cloudflared',
      dbPort: 5432,
      dbName: 'prisma',
      isActive: true,
      masterVersion: 3,
      healthStatus: 'ONLINE',
      latencyMs: 32,
      lastSeenAt: '2026-09-25T12:00:00Z',
      lastSyncAt: '2026-09-25T11:58:00Z',
    },
    {
      id: 'store-2',
      code: '002',
      name: 'Estación Las Lomas',
      ip: '192.168.1.50',
      dbPort: 5432,
      dbName: 'prisma',
      isActive: true,
      masterVersion: 1,
      healthStatus: 'OFFLINE',
      latencyMs: null,
      lastSeenAt: '2026-09-25T08:00:00Z',
      lastSyncAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/stores') {
        return Promise.resolve({ data: mockStores });
      }
      if (url === '/stores/health-status') {
        return Promise.resolve({
          data: [
            { id: 'store-1', healthStatus: 'ONLINE', latencyMs: 32 },
            { id: 'store-2', healthStatus: 'OFFLINE', latencyMs: null },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renderiza las métricas KPI de la red (Total, En Línea, Desconectadas, Hub Matriz)', async () => {
    render(<StoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Estación Kennedy')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Estaciones')).toBeInTheDocument();
    expect(screen.getByText('En Línea (Cloud)')).toBeInTheDocument();
    expect(screen.getByText('Desconectadas')).toBeInTheDocument();
    expect(screen.getByText('Store 000 Matriz')).toBeInTheDocument();
  });

  it('muestra el badge de Cloudflare Tunnel y versión de catálogo para tiendas con túnel', async () => {
    render(<StoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Estación Kennedy')).toBeInTheDocument();
    });

    expect(screen.getByText('Tunnel')).toBeInTheDocument();
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByText('(32ms)')).toBeInTheDocument();
  });

  it('permite filtrar tiendas por estado Online u Offline', async () => {
    render(<StoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Estación Kennedy')).toBeInTheDocument();
      expect(screen.getByText('Estación Las Lomas')).toBeInTheDocument();
    });

    // Click en filtro Offline
    const offlineFilterBtn = screen.getByRole('button', { name: /Offline \(1\)/i });
    fireEvent.click(offlineFilterBtn);

    expect(screen.queryByText('Estación Kennedy')).not.toBeInTheDocument();
    expect(screen.getByText('Estación Las Lomas')).toBeInTheDocument();
  });

  it('renderiza botones de administración para usuarios con rol ADMIN o permiso storesManage', async () => {
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(can).mockReturnValue(true);

    render(<StoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Estación Kennedy')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Nueva Tienda/i })).toBeInTheDocument();
    expect(screen.queryByText('Modo Consulta')).not.toBeInTheDocument();
    expect(screen.getAllByTitle('Editar tienda').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('Eliminar tienda').length).toBeGreaterThan(0);
  });

  it('oculta botones de mutación y muestra Modo Consulta para usuarios no administradores', async () => {
    vi.mocked(isAdmin).mockReturnValue(false);
    vi.mocked(can).mockReturnValue(false);

    render(<StoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Estación Kennedy')).toBeInTheDocument();
    });

    expect(screen.getByText('Modo Consulta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nueva Tienda/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Editar tienda')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Eliminar tienda')).not.toBeInTheDocument();
  });

  it('no envía dbPassword si se deja vacío al guardar una edición', async () => {
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(can).mockReturnValue(true);
    (api.patch as any).mockResolvedValue({ data: { success: true } });

    render(<StoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Estación Kennedy')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Editar tienda');
    fireEvent.click(editButtons[0]);

    // Modal abierto
    expect(screen.getByText('Editar Tienda')).toBeInTheDocument();

    // Guardar sin escribir contraseña
    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/stores/store-1',
        expect.not.objectContaining({ dbPassword: expect.anything() }),
      );
    });
  });
});
