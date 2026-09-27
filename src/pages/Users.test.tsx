import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UsersPage } from './Users';
import api from '../infrastructure/api/api-client';

vi.mock('../infrastructure/api/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('UsersPage & RBAC Multi-role Management', () => {
  const mockUsers = [
    {
      id: 'u-1',
      username: 'carlos',
      name: 'Carlos Mendoza',
      role: 'ADMIN',
      roles: ['ADMIN'],
      isActive: true,
      pin: '1234',
      codigoRfid: 'RFID1',
    },
    {
      id: 'u-2',
      username: 'maria',
      name: 'Maria Lopez',
      role: 'CAJERO',
      roles: ['CAJERO', 'SUPERVISOR'], // Multirrol
      isActive: true,
      pin: null,
      codigoRfid: null,
    },
  ];

  const mockRoles = [
    {
      id: 'ADMIN',
      name: 'Administrador',
      description: 'Acceso administrativo',
      isSystem: true,
      isActive: true,
      permissions: [{ permissionId: 'sales:create' }, { permissionId: 'users:manage' }],
      _count: { users: 1 },
    },
    {
      id: 'CAJERO',
      name: 'Cajero',
      description: 'Ventas en mostrador',
      isSystem: true,
      isActive: true,
      permissions: [{ permissionId: 'sales:create' }],
      _count: { users: 1 },
    },
    {
      id: 'SUPERVISOR',
      name: 'Supervisor',
      description: 'Supervisión de turnos',
      isSystem: true,
      isActive: true,
      permissions: [{ permissionId: 'shifts:close' }],
      _count: { users: 1 },
    },
    {
      id: 'CUSTOM_AUDITOR',
      name: 'Auditor Externo',
      description: 'Rol personalizado',
      isSystem: false,
      isActive: true,
      permissions: [{ permissionId: 'reports:view' }],
      _count: { users: 0 },
    },
  ];

  const mockPermissions = [
    { id: 'sales:create', name: 'Emitir Facturas', module: 'Ventas', description: 'Venta POS' },
    { id: 'sales:cancel', name: 'Anular Facturas', module: 'Ventas', description: 'Anulación' },
    { id: 'shifts:close', name: 'Cerrar Turno', module: 'Turnos', description: 'Arqueo' },
    { id: 'reports:view', name: 'Ver Reportes', module: 'Reportes', description: 'Reportes' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/users') {
        return Promise.resolve({ data: mockUsers });
      }
      if (url === '/roles') {
        return Promise.resolve({ data: mockRoles });
      }
      if (url === '/permissions') {
        return Promise.resolve({ data: mockPermissions });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renderiza la lista de usuarios mostrando badges de múltiples roles', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    });

    // Maria tiene roles combinados CAJERO y SUPERVISOR
    expect(screen.getByText('CAJERO')).toBeInTheDocument();
    expect(screen.getByText('SUPERVISOR')).toBeInTheDocument();
  });

  it('abre el modal de gestión de roles al presionar el botón "Gestionar Roles"', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
    });

    const manageBtn = screen.getByRole('button', { name: /Gestionar Roles/i });
    fireEvent.click(manageBtn);

    await waitFor(() => {
      expect(screen.getByText(/Gestión de Roles y Permisos \(RBAC\)/i)).toBeInTheDocument();
    });

    // Muestra roles del sistema y personalizados
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Auditor Externo')).toBeInTheDocument();
  });

  it('permite crear un nuevo rol seleccionando permisos por módulo en el modal', async () => {
    (api.post as any).mockResolvedValueOnce({ data: { id: 'ROL_TEST', name: 'Rol Test' } });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Gestionar Roles/i }));

    await waitFor(() => {
      expect(screen.getByText('Nuevo Rol')).toBeInTheDocument();
    });

    // Abrir formulario de creación de rol
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Rol/i }));

    expect(screen.getByText('Definir Nuevo Rol Personalizado')).toBeInTheDocument();

    // Rellenar datos
    const idInput = screen.getByPlaceholderText('AUDITOR_EXT');
    const nameInput = screen.getByPlaceholderText('Auditor Externo');

    fireEvent.change(idInput, { target: { value: 'ROL_TEST' } });
    fireEvent.change(nameInput, { target: { value: 'Rol Test' } });

    // Seleccionar permiso
    const permCheckbox = screen.getByLabelText(/Emitir Facturas/i);
    fireEvent.click(permCheckbox);

    // Guardar rol
    const saveBtn = screen.getByRole('button', { name: /Guardar Rol/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/roles', {
        id: 'ROL_TEST',
        name: 'Rol Test',
        permissionIds: expect.arrayContaining(['sales:create']),
      });
    });
  });

  it('permite asignar múltiples roles al editar un usuario', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: { id: 'u-1' } });
    (api.post as any).mockResolvedValueOnce({ data: { roles: ['ADMIN', 'SUPERVISOR'] } });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
    });

    // Click en editar primer usuario
    const editBtns = screen.getAllByTitle('Editar usuario');
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
    });

    // Toggle rol adicional SUPERVISOR
    const supervisorBtn = screen.getByRole('button', { name: /Supervisor/i });
    fireEvent.click(supervisorBtn);

    // Guardar cambios
    const saveBtn = screen.getByRole('button', { name: /Actualizar/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/u-1', expect.anything());
      expect(api.post).toHaveBeenCalledWith('/users/u-1/roles', {
        roleIds: expect.arrayContaining(['ADMIN', 'SUPERVISOR']),
      });
    });
  });
});
