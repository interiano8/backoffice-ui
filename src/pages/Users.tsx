import React, { useState, useEffect } from 'react';
import api from '../infrastructure/api/api-client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Users, Plus, Pencil, UserCheck, UserX, Check, X, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RolesManagementModal } from '../components/RolesManagementModal';

interface UserData {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: string;
  roles?: string[];
  isActive: boolean;
  pin?: string;
  codigoRfid?: string;
}

interface RoleDefinition {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

const DEFAULT_ROLES_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  ADMIN: 'bg-red-500/10 text-red-600 border-red-500/20',
  SUPERVISOR: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CAJERO: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  BOMBERO: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  AUDITOR: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  GESTOR_COMERCIAL: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
};

const getRoleBadgeClass = (role: string) => {
  const norm = role.toUpperCase().replace(/\s+/g, '_');
  return DEFAULT_ROLES_COLORS[norm] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';
};

const isIndicador = (v: string | undefined | null): boolean =>
  v !== undefined && v !== null && v !== '';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UserData | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    pin: '',
    role: 'ADMIN',
    roles: ['ADMIN'] as string[],
    codigoRfid: '',
  });

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      if (Array.isArray(data) && data.length > 0) {
        setAvailableRoles(data);
      }
    } catch {
      // Fallback a roles básicos si /roles aún no responde
      setAvailableRoles([
        { id: 'SUPER_ADMIN', name: 'Super Administrador' },
        { id: 'ADMIN', name: 'Administrador' },
        { id: 'SUPERVISOR', name: 'Supervisor' },
        { id: 'CAJERO', name: 'Cajero' },
        { id: 'BOMBERO', name: 'Bombero' },
        { id: 'AUDITOR', name: 'Auditor' },
      ]);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data || []);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const activeCount = users.filter(u => u.isActive).length;
  const totalCount = users.length;

  const openCreate = () => {
    setEditingUser(null);
    setForm({
      username: '',
      password: '',
      name: '',
      email: '',
      pin: '',
      role: 'ADMIN',
      roles: ['ADMIN'],
      codigoRfid: '',
    });
    setModalOpen(true);
  };

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    const userRoles = user.roles && user.roles.length > 0
      ? user.roles
      : [user.role || 'ADMIN'];
    setForm({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      pin: '',
      role: userRoles[0] || 'ADMIN',
      roles: userRoles,
      codigoRfid: '',
    });
    setModalOpen(true);
  };

  const toggleRoleInForm = (roleId: string) => {
    setForm((prev) => {
      const exists = prev.roles.includes(roleId);
      let nextRoles: string[];
      if (exists) {
        if (prev.roles.length === 1) {
          toast.warning('El usuario debe conservar al menos un rol asignado');
          return prev;
        }
        nextRoles = prev.roles.filter((r) => r !== roleId);
      } else {
        nextRoles = [...prev.roles, roleId];
      }
      return {
        ...prev,
        roles: nextRoles,
        role: nextRoles[0] || 'ADMIN',
      };
    });
  };

  const handleSave = async () => {
    if (!form.username || !form.name) {
      toast.error('Usuario y nombre son requeridos');
      return;
    }
    const cleanEmail = form.email.trim();
    if (!editingUser && !cleanEmail) {
      toast.error('El correo electrónico es obligatorio');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (cleanEmail && !emailRegex.test(cleanEmail)) {
      toast.error('El correo electrónico no tiene un formato válido');
      return;
    }
    if (!editingUser && !form.password) {
      toast.error('Contraseña es requerida');
      return;
    }
    if (form.roles.length === 0) {
      toast.error('Selecciona al menos un rol para el usuario');
      return;
    }

    setSaving(true);
    try {
      let targetUserId = editingUser?.id;
      if (editingUser) {
        const payload: any = { name: form.name, role: form.role };
        if (cleanEmail) payload.email = cleanEmail;
        if (form.password) payload.password = form.password;
        if (form.pin) payload.pin = form.pin;
        if (form.codigoRfid) payload.codigoRfid = form.codigoRfid;
        await api.patch(`/users/${editingUser.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        const { data: created } = await api.post('/users', {
          username: form.username,
          password: form.password,
          name: form.name,
          email: cleanEmail,
          role: form.role,
          pin: form.pin,
          codigoRfid: form.codigoRfid,
        });
        targetUserId = created?.id || form.username;
        toast.success('Usuario creado');
      }

      // Sincronizar asignación multirrol en backend si targetUserId está disponible
      if (targetUserId) {
        await api.post(`/users/${targetUserId}/roles`, { roleIds: form.roles }).catch(() => {});
      }

      setModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (user: UserData) => {
    setToggleTarget(user);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const user = toggleTarget;
    setToggleTarget(null);
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
      toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'}`);
      fetchUsers();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-3 p-1">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-xl font-bold tracking-tight">Usuarios y Acceso</h1>
          </div>
          <div className="flex items-center gap-3 ml-2 pl-3 border-l">
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{totalCount}</span> total
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-500">{activeCount}</span> activos
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-muted-foreground">{totalCount - activeCount}</span> inactivos
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRolesModalOpen(true)}
            className="gap-1.5 h-8 border-accent/40 text-accent hover:bg-accent/10"
          >
            <Shield className="h-3.5 w-3.5" /> Gestionar Roles
          </Button>
          <Button onClick={openCreate} size="sm" className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" /> Nuevo Usuario
          </Button>
        </div>
      </div>

      <Card className="flex-1 min-h-0 border-0 shadow-none">
        <CardContent className="p-0 h-full">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-auto h-full rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-card hover:bg-card z-10 shadow-[0_1px_0_0] shadow-border">
                    <TableHead className="w-[140px]">Usuario</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[80px] text-center">PIN Leal</TableHead>
                    <TableHead className="min-w-[180px]">Roles Asignados</TableHead>
                    <TableHead className="w-[80px] text-center">RFID</TableHead>
                    <TableHead className="w-[90px]">Estado</TableHead>
                    <TableHead className="w-[80px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const userRoles = user.roles && user.roles.length > 0
                      ? user.roles
                      : [user.role || 'ADMIN'];
                    return (
                      <TableRow key={user.id} className="h-10">
                        <TableCell className="font-mono text-xs font-medium py-1.5">
                          {user.username}
                        </TableCell>
                        <TableCell className="text-sm py-1.5">{user.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground py-1.5">
                          {user.email || '—'}
                        </TableCell>
                        <TableCell className="text-center py-1.5">
                          {isIndicador(user.pin) ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <div className="flex flex-wrap gap-1">
                            {userRoles.map((r) => (
                              <Badge
                                key={r}
                                className={`text-[10px] font-semibold ${getRoleBadgeClass(r)}`}
                                variant="outline"
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-1.5">
                          {isIndicador(user.codigoRfid) ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Badge
                            variant={user.isActive ? 'default' : 'secondary'}
                            className="text-[10px] font-medium"
                          >
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-1.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(user)}
                              className="h-7 w-7"
                              title="Editar usuario"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(user)}
                              className="h-7 w-7"
                              title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                            >
                              {user.isActive ? (
                                <UserX className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5 text-muted-foreground hover:text-emerald-500 transition-colors" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear / Editar Usuario */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Usuario *
                </label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toUpperCase() })}
                  disabled={!!editingUser}
                  placeholder="USUARIO"
                  className="h-9 uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Nombre *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre completo"
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Correo Electrónico {editingUser ? '(opcional)' : '*'}
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  PIN Leal
                </label>
                <Input
                  type={editingUser ? 'password' : 'text'}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  placeholder={editingUser ? '••••••' : 'PIN'}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Código RFID
                </label>
                <Input
                  type={editingUser ? 'password' : 'text'}
                  value={form.codigoRfid}
                  onChange={(e) => setForm({ ...form, codigoRfid: e.target.value })}
                  placeholder={editingUser ? '••••••' : 'RFID'}
                  className="h-9"
                />
              </div>
            </div>

            {/* Asignación interactiva de múltiples roles (RBAC) */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Roles Asignados (Selección múltiple RBAC) *
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-card/60">
                {availableRoles.map((r) => {
                  const isSelected = form.roles.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRoleInForm(r.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-accent/15 border-accent text-accent font-semibold shadow-xs'
                          : 'bg-background border-border text-muted-foreground hover:bg-card hover:text-foreground'
                      }`}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Contraseña {editingUser ? '(opcional)' : '*'}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingUser ? 'Sin cambios' : 'Requerida'}
                className="h-9"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de activación/desactivación */}
      <Dialog
        open={!!toggleTarget}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mb-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <DialogTitle className="text-center text-base">
              {toggleTarget?.isActive ? 'Desactivar usuario' : 'Activar usuario'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground">
            {toggleTarget?.isActive
              ? `¿Estás seguro de desactivar a "${toggleTarget?.username}"? No podrá iniciar sesión.`
              : `¿Estás seguro de activar a "${toggleTarget?.username}"? Podrá iniciar sesión nuevamente.`}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" onClick={() => setToggleTarget(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant={toggleTarget?.isActive ? 'destructive' : 'default'}
              onClick={handleConfirmToggle}
            >
              {toggleTarget?.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de gestión de roles y catálogo de permisos */}
      <RolesManagementModal
        open={rolesModalOpen}
        onOpenChange={setRolesModalOpen}
        onRolesUpdated={() => {
          fetchUsers();
          fetchRoles();
        }}
      />
    </div>
  );
};
