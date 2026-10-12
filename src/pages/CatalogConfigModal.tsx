import React, { useState } from 'react';
import {
  Department,
  Category,
  Supplier,
  productsService,
} from '@/services/products.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Building, Layers, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface CatalogConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  categories: Category[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

export const CatalogConfigModal: React.FC<CatalogConfigModalProps> = ({
  isOpen,
  onClose,
  departments,
  categories,
  suppliers,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'suppliers'>('departments');

  // Form states
  const [depCode, setDepCode] = useState('');
  const [depName, setDepName] = useState('');

  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catDepartmentId, setCatDepartmentId] = useState('');

  const [supCode, setSupCode] = useState('');
  const [supName, setSupName] = useState('');
  const [supTaxId, setSupTaxId] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depName.trim()) {
      toast.error('El nombre de departamento es requerido');
      return;
    }
    setLoading(true);
    try {
      const created = await productsService.createDepartment({
        code: depCode.trim() ? depCode.trim().toUpperCase() : undefined,
        name: depName.trim(),
      });
      toast.success(`Departamento creado exitosamente con el código: ${created.code}`, {
        duration: 7000,
      });
      setDepCode('');
      setDepName('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando departamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('El nombre de categoría es requerido');
      return;
    }
    setLoading(true);
    try {
      const created = await productsService.createCategory({
        code: catCode.trim() ? catCode.trim().toUpperCase() : undefined,
        name: catName.trim(),
        departmentId: catDepartmentId || undefined,
      });
      toast.success(`Categoría creada exitosamente con el código: ${created.code}`, {
        duration: 7000,
      });
      setCatCode('');
      setCatName('');
      setCatDepartmentId('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      toast.error('El nombre de proveedor es requerido');
      return;
    }
    setLoading(true);
    try {
      const created = await productsService.createSupplier({
        code: supCode.trim() ? supCode.trim().toUpperCase() : undefined,
        name: supName.trim(),
        taxId: supTaxId || undefined,
        phone: supPhone || undefined,
        email: supEmail || undefined,
      });
      toast.success(`Proveedor creado exitosamente con el código: ${created.code}`, {
        duration: 7000,
      });
      setSupCode('');
      setSupName('');
      setSupTaxId('');
      setSupPhone('');
      setSupEmail('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDepartment = async (id: string) => {
    try {
      await productsService.toggleDepartment(id);
      onRefresh();
    } catch (err: any) {
      toast.error('Error al actualizar estado del departamento');
    }
  };

  const handleToggleCategory = async (id: string) => {
    try {
      await productsService.toggleCategory(id);
      onRefresh();
    } catch (err: any) {
      toast.error('Error al actualizar estado de la categoría');
    }
  };

  const handleToggleSupplier = async (id: string) => {
    try {
      await productsService.toggleSupplier(id);
      onRefresh();
    } catch (err: any) {
      toast.error('Error al actualizar estado del proveedor');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Configuración de Departamentos, Categorías y Proveedores
          </DialogTitle>
        </DialogHeader>

        {/* Selector de pestañas */}
        <div className="flex border-b border-border gap-2 pb-2">
          <Button
            type="button"
            variant={activeTab === 'departments' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('departments')}
            className="gap-2"
          >
            <Building className="w-4 h-4" /> Departamentos ({departments.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === 'categories' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('categories')}
            className="gap-2"
          >
            <Layers className="w-4 h-4" /> Categorías ({categories.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === 'suppliers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('suppliers')}
            className="gap-2"
          >
            <Truck className="w-4 h-4" /> Proveedores ({suppliers.length})
          </Button>
        </div>

        {/* Tab Departamentos */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateDepartment} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-muted/40 p-3 rounded-lg border border-border">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Código (Auto o manual)</label>
                <Input
                  placeholder="Auto (DEP-00001)"
                  value={depCode}
                  onChange={(e) => setDepCode(e.target.value.toUpperCase())}
                  className="h-9 uppercase font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                <Input
                  placeholder="LUBRICANTES"
                  value={depName}
                  onChange={(e) => setDepName(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-9 gap-1">
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </form>

            <div className="rounded-md border border-border max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-center">Estado</th>
                    <th className="p-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground text-xs">
                        No hay departamentos registrados.
                      </td>
                    </tr>
                  ) : (
                    departments.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="p-2 font-mono font-bold text-xs">{d.code}</td>
                        <td className="p-2">{d.name}</td>
                        <td className="p-2 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {d.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleToggleDepartment(d.id)}
                          >
                            {d.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Categorías */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end bg-muted/40 p-3 rounded-lg border border-border">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Código (Auto o manual)</label>
                <Input
                  placeholder="Auto (CAT-00001)"
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  className="h-9 uppercase font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                <Input
                  placeholder="ACEITES SINTÉTICOS"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                <select
                  value={catDepartmentId}
                  onChange={(e) => setCatDepartmentId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">(Sin departamento)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={loading} className="h-9 gap-1">
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </form>

            <div className="rounded-md border border-border max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-left">Departamento</th>
                    <th className="p-2 text-center">Estado</th>
                    <th className="p-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">
                        No hay categorías registradas.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="p-2 font-mono font-bold text-xs">{c.code}</td>
                        <td className="p-2">{c.name}</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {c.department ? `${c.department.code} - ${c.department.name}` : '-'}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${c.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {c.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleToggleCategory(c.id)}
                          >
                            {c.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Proveedores */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateSupplier} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-muted/40 p-3 rounded-lg border border-border">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Código (Auto o manual)</label>
                <Input
                  placeholder="Auto (PRV-00001)"
                  value={supCode}
                  onChange={(e) => setSupCode(e.target.value.toUpperCase())}
                  className="h-9 uppercase font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre / Razón Social *</label>
                <Input
                  placeholder="DISTRIBUIDORA CENTRAL S.A."
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">RTN / Identificación</label>
                <Input
                  placeholder="08011990123456"
                  value={supTaxId}
                  onChange={(e) => setSupTaxId(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
                <Input
                  placeholder="+504 9999-9999"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Correo electrónico</label>
                <Input
                  type="email"
                  placeholder="ventas@proveedor.com"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading} className="h-9 w-full gap-1">
                  <Plus className="w-4 h-4" /> Registrar Proveedor
                </Button>
              </div>
            </form>

            <div className="rounded-md border border-border max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-left">RTN</th>
                    <th className="p-2 text-left">Tel / Email</th>
                    <th className="p-2 text-center">Estado</th>
                    <th className="p-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground text-xs">
                        No hay proveedores registrados.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="p-2 font-mono font-bold text-xs">{s.code}</td>
                        <td className="p-2 font-medium">{s.name}</td>
                        <td className="p-2 text-xs font-mono">{s.taxId || '-'}</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {s.phone ? `${s.phone} ` : ''}{s.email ? `(${s.email})` : ''}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${s.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {s.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleToggleSupplier(s.id)}
                          >
                            {s.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
