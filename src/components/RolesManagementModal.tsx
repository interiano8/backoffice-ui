import React, { useState, useEffect } from 'react';
import api from '../infrastructure/api/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Plus, Trash2, Lock, Loader2, Sparkles } from 'lucide-react';

interface PermissionItem {
  id: string;
  name: string;
  module: string;
  description: string;
}

interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions?: { permissionId: string }[];
  _count?: { users: number };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRolesUpdated?: () => void;
}

export const RolesManagementModal: React.FC<Props> = ({ open, onOpenChange, onRolesUpdated }) => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulario nuevo rol
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions'),
      ]);
      setRoles(rolesRes.data || []);
      setPermissions(permsRes.data || []);
    } catch {
      toast.error('Error al cargar catálogo de roles y permisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Agrupar permisos por módulo
  const modules = Array.from(new Set(permissions.map((p) => p.module))).sort();

  const handleTogglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleToggleModule = (moduleName: string) => {
    const modPerms = permissions.filter((p) => p.module === moduleName).map((p) => p.id);
    const allSelected = modPerms.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !modPerms.includes(id)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modPerms])));
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleId.trim() || !newRoleName.trim()) {
      toast.error('Identificador y nombre son requeridos');
      return;
    }
    if (selectedPermissions.length === 0) {
      toast.error('Selecciona al menos un permiso para el rol');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/roles', {
        id: newRoleId.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
        permissionIds: selectedPermissions,
      });
      toast.success('Rol personalizado creado exitosamente');
      setNewRoleId('');
      setNewRoleName('');
      setNewRoleDesc('');
      setSelectedPermissions([]);
      setCreating(false);
      await loadData();
      onRolesUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear rol');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (role.isSystem) {
      toast.error('Los roles del sistema son inmutables y no se pueden eliminar');
      return;
    }
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;

    try {
      await api.delete(`/roles/${role.id}`);
      toast.success('Rol eliminado');
      await loadData();
      onRolesUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar rol');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="shrink-0 flex flex-row items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <DialogTitle className="text-lg font-bold">Gestión de Roles y Permisos (RBAC)</DialogTitle>
          </div>
          {!creating && (
            <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" /> Nuevo Rol
            </Button>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : creating ? (
          /* Formulario de creación de rol */
          <form onSubmit={handleCreateRole} className="flex-1 overflow-auto flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Definir Nuevo Rol Personalizado</div>
              <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                Volver a la lista
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Identificador / Código * (ej. AUDITOR_EXT)
                </label>
                <Input
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value.toUpperCase())}
                  placeholder="AUDITOR_EXT"
                  className="font-mono h-9 uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Nombre del Rol *
                </label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Auditor Externo"
                  className="h-9"
                  required
                />
              </div>
            </div>

            <div className="shrink-0">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Descripción (opcional)
              </label>
              <Input
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Auditoría y conciliación financiera externa"
                className="h-9"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Matriz de Permisos por Módulo ({selectedPermissions.length} seleccionados)
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => setSelectedPermissions(permissions.map((p) => p.id))}
                  >
                    Seleccionar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => setSelectedPermissions([])}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pr-2">
                {modules.map((mod) => {
                  const modPerms = permissions.filter((p) => p.module === mod);
                  const allModSelected = modPerms.every((p) => selectedPermissions.includes(p.id));
                  return (
                    <div key={mod} className="rounded-lg border bg-card/60 p-3">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          {mod}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-muted-foreground hover:text-foreground"
                          onClick={() => handleToggleModule(mod)}
                        >
                          {allModSelected ? 'Deseleccionar módulo' : 'Seleccionar módulo'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {modPerms.map((p) => {
                          const isChecked = selectedPermissions.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-accent/10 border-accent text-accent-foreground'
                                  : 'bg-card border-border hover:bg-card/80 text-muted-foreground'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(p.id)}
                                className="mt-0.5 rounded border-border text-accent focus:ring-accent"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{p.name}</span>
                                <span className="font-mono text-[10px] text-muted-foreground">{p.id}</span>
                                {p.description && (
                                  <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                                    {p.description}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t mt-auto">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Guardar Rol
              </Button>
            </div>
          </form>
        ) : (
          /* Lista de roles */
          <div className="flex-1 overflow-auto space-y-2 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border bg-card p-3 flex flex-col justify-between hover:border-accent/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-foreground">{r.name}</span>
                        {r.isSystem ? (
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20 gap-1">
                            <Lock className="h-2.5 w-2.5" /> Sistema
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> Personalizado
                          </Badge>
                        )}
                      </div>
                      {!r.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDeleteRole(r)}
                          title="Eliminar rol personalizado"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground mt-0.5">{r.id}</div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2 mt-3">
                    <span>{r.permissions?.length ?? 0} permisos asignados</span>
                    <span className="font-semibold text-foreground">
                      {r._count?.users ?? 0} usuarios
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
