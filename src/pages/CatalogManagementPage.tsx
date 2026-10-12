import React, { useState, useEffect } from 'react';
import {
  Department,
  Category,
  Supplier,
  UnitOfMeasure,
  productsService,
} from '@/services/products.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building,
  Layers,
  Truck,
  Scale,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { TablePagination } from '@/components/TablePagination';
import {
  generateSuggestedDepartmentCode,
  generateSuggestedCategoryCode,
  generateSuggestedSupplierCode,
} from '@/lib/code-generators';

export const CatalogManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'suppliers' | 'units'>('departments');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states - Departamentos
  const [depCode, setDepCode] = useState('');
  const [depName, setDepName] = useState('');

  // Form states - Categorías
  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catDepartmentId, setCatDepartmentId] = useState('');

  // Form states - Proveedores
  const [supCode, setSupCode] = useState('');
  const [supName, setSupName] = useState('');
  const [supTaxId, setSupTaxId] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Form states - Unidades de Medida
  const [uomCode, setUomCode] = useState('');
  const [uomName, setUomName] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [deps, cats, sups, uoms] = await Promise.all([
        productsService.getDepartments(),
        productsService.getCategories(),
        productsService.getSuppliers(),
        productsService.getUnitsOfMeasure(),
      ]);
      setDepartments(deps);
      setCategories(cats);
      setSuppliers(sups);
      setUnits(uoms);

      // Sugerir códigos automáticamente si están vacíos
      setDepCode((prev) => prev || generateSuggestedDepartmentCode(deps.map((d) => d.code)));
      setCatCode((prev) => prev || generateSuggestedCategoryCode(cats.map((c) => c.code)));
      setSupCode((prev) => prev || generateSuggestedSupplierCode(sups.map((s) => s.code)));
    } catch (err: any) {
      toast.error('Error cargando catálogos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Paginación por tab
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  // --- Handlers Creación ---
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depCode.trim() || !depName.trim()) {
      toast.error('Código y nombre de departamento requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await productsService.createDepartment({ code: depCode, name: depName });
      toast.success('Departamento creado exitosamente');
      setDepCode('');
      setDepName('');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando departamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catCode.trim() || !catName.trim()) {
      toast.error('Código y nombre de categoría requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await productsService.createCategory({
        code: catCode,
        name: catName,
        departmentId: catDepartmentId || undefined,
      });
      toast.success('Categoría creada exitosamente');
      setCatCode('');
      setCatName('');
      setCatDepartmentId('');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando categoría');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supCode.trim() || !supName.trim()) {
      toast.error('Código y nombre de proveedor requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await productsService.createSupplier({
        code: supCode,
        name: supName,
        taxId: supTaxId || undefined,
        phone: supPhone || undefined,
        email: supEmail || undefined,
        address: supAddress || undefined,
      });
      toast.success('Proveedor creado exitosamente');
      setSupCode('');
      setSupName('');
      setSupTaxId('');
      setSupPhone('');
      setSupEmail('');
      setSupAddress('');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando proveedor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uomCode.trim() || !uomName.trim()) {
      toast.error('Código y nombre de unidad requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await productsService.createUnitOfMeasure({ code: uomCode, name: uomName });
      toast.success('Unidad de medida creada exitosamente');
      setUomCode('');
      setUomName('');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creando unidad de medida');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers Toggles ---
  const handleToggleDepartment = async (id: string) => {
    try {
      await productsService.toggleDepartment(id);
      loadAll();
    } catch {
      toast.error('Error al actualizar estado del departamento');
    }
  };

  const handleToggleCategory = async (id: string) => {
    try {
      await productsService.toggleCategory(id);
      loadAll();
    } catch {
      toast.error('Error al actualizar estado de la categoría');
    }
  };

  const handleToggleSupplier = async (id: string) => {
    try {
      await productsService.toggleSupplier(id);
      loadAll();
    } catch {
      toast.error('Error al actualizar estado del proveedor');
    }
  };

  const handleToggleUnit = async (id: string) => {
    try {
      await productsService.toggleUnitOfMeasure(id);
      loadAll();
    } catch {
      toast.error('Error al actualizar estado de la unidad');
    }
  };

  // Filtros de búsqueda
  const filteredDepartments = departments.filter(
    (d) =>
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const paginatedDepartments = filteredDepartments.slice((page - 1) * pageSize, page * pageSize);

  const filteredCategories = categories.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.department && c.department.name.toLowerCase().includes(searchTerm.toLowerCase())),
  );
  const paginatedCategories = filteredCategories.slice((page - 1) * pageSize, page * pageSize);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.taxId && s.taxId.includes(searchTerm)),
  );
  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * pageSize, page * pageSize);

  const filteredUnits = units.filter(
    (u) =>
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const paginatedUnits = filteredUnits.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Estructura y Maestros de Catálogo
          </h1>
          <p className="text-sm text-muted-foreground">
            Administración centralizada de Departamentos, Categorías, Proveedores y Unidades de Medida.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAll}
          className="gap-2 text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recargar
        </Button>
      </div>

      {/* Tabs principales */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <Button
          type="button"
          variant={activeTab === 'departments' ? 'default' : 'secondary'}
          onClick={() => { setActiveTab('departments'); setSearchTerm(''); }}
          className="gap-2 text-xs"
        >
          <Building className="w-4 h-4" /> Departamentos ({departments.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === 'categories' ? 'default' : 'secondary'}
          onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
          className="gap-2 text-xs"
        >
          <Layers className="w-4 h-4" /> Categorías ({categories.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === 'suppliers' ? 'default' : 'secondary'}
          onClick={() => { setActiveTab('suppliers'); setSearchTerm(''); }}
          className="gap-2 text-xs"
        >
          <Truck className="w-4 h-4" /> Proveedores ({suppliers.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === 'units' ? 'default' : 'secondary'}
          onClick={() => { setActiveTab('units'); setSearchTerm(''); }}
          className="gap-2 text-xs"
        >
          <Scale className="w-4 h-4" /> Unidades de Medida ({units.length})
        </Button>
      </div>

      {/* Buscador de elementos dentro de la pestaña actual */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder={`Buscar en ${activeTab === 'departments' ? 'departamentos' : activeTab === 'categories' ? 'categorías' : activeTab === 'suppliers' ? 'proveedores' : 'unidades de medida'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* TAB 1: DEPARTAMENTOS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Alta */}
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" /> Nuevo Departamento
            </h3>
            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-muted-foreground">Código *</label>
                  <button
                    type="button"
                    onClick={() => setDepCode(generateSuggestedDepartmentCode(departments.map((d) => d.code)))}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
                <Input
                  placeholder="DEP-01"
                  value={depCode}
                  onChange={(e) => setDepCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
                <Input
                  placeholder="LUBRICANTES Y ADITIVOS"
                  value={depName}
                  onChange={(e) => setDepName(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gap-1">
                <Plus className="w-4 h-4" /> Crear Departamento
              </Button>
            </form>
          </div>

          {/* Listado de Departamentos */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col justify-between">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-center">Categorías</th>
                  <th className="p-3 text-center">Productos</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                      No se encontraron departamentos.
                    </td>
                  </tr>
                ) : (
                  paginatedDepartments.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold text-xs text-primary">{d.code}</td>
                      <td className="p-3 font-medium">{d.name}</td>
                      <td className="p-3 text-center text-xs text-muted-foreground">
                        {d.categories?.length || 0}
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">
                        {d._count?.products || 0}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${d.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {d.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
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

            <TablePagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={filteredDepartments.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORÍAS */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Alta */}
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Nueva Categoría
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-muted-foreground">Código *</label>
                  <button
                    type="button"
                    onClick={() => setCatCode(generateSuggestedCategoryCode(categories.map((c) => c.code)))}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
                <Input
                  placeholder="CAT-01"
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
                <Input
                  placeholder="ACEITES SINTÉTICOS"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Departamento Padre</label>
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
              <Button type="submit" disabled={submitting} className="w-full gap-1">
                <Plus className="w-4 h-4" /> Crear Categoría
              </Button>
            </form>
          </div>

          {/* Listado de Categorías */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col justify-between">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-left">Departamento</th>
                  <th className="p-3 text-center">Productos</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                      No se encontraron categorías.
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold text-xs text-primary">{c.code}</td>
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {c.department ? `${c.department.code} - ${c.department.name}` : '-'}
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">
                        {c._count?.products || 0}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${c.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {c.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
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

            <TablePagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={filteredCategories.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {/* TAB 3: PROVEEDORES */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Alta */}
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" /> Nuevo Proveedor
            </h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-muted-foreground">Código *</label>
                  <button
                    type="button"
                    onClick={() => setSupCode(generateSuggestedSupplierCode(suppliers.map((s) => s.code)))}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
                <Input
                  placeholder="PRV-001"
                  value={supCode}
                  onChange={(e) => setSupCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nombre / Razón Social *</label>
                <Input
                  placeholder="DISTRIBUIDORA CENTRAL S.A."
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">RTN / Identificación</label>
                <Input
                  placeholder="08011990123456"
                  value={supTaxId}
                  onChange={(e) => setSupTaxId(e.target.value)}
                  className="h-9 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Teléfono</label>
                <Input
                  placeholder="+504 9999-9999"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Correo Electrónico</label>
                <Input
                  type="email"
                  placeholder="ventas@proveedor.com"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Dirección Física</label>
                <Input
                  placeholder="Tegucigalpa, Honduras"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gap-1">
                <Plus className="w-4 h-4" /> Registrar Proveedor
              </Button>
            </form>
          </div>

          {/* Listado de Proveedores */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col justify-between">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Proveedor</th>
                  <th className="p-3 text-left">RTN</th>
                  <th className="p-3 text-left">Contacto</th>
                  <th className="p-3 text-center">Productos</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {paginatedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground text-xs">
                      No se encontraron proveedores.
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold text-xs text-primary">{s.code}</td>
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-xs font-mono">{s.taxId || '-'}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {s.phone ? `${s.phone} ` : ''}{s.email ? `(${s.email})` : ''}
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">
                        {s._count?.products || 0}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${s.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {s.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
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

            <TablePagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={filteredSuppliers.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {/* TAB 4: UNIDADES DE MEDIDA */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Alta */}
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" /> Nueva Unidad de Medida
            </h3>
            <form onSubmit={handleCreateUnit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Código / Símbolo *</label>
                <Input
                  placeholder="UND, GL, LT, KG..."
                  value={uomCode}
                  onChange={(e) => setUomCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase h-9"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nombre Completo *</label>
                <Input
                  placeholder="Unidad, Galón, Litro, Kilogramo..."
                  value={uomName}
                  onChange={(e) => setUomName(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gap-1">
                <Plus className="w-4 h-4" /> Crear Unidad
              </Button>
            </form>
          </div>

          {/* Listado de Unidades */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col justify-between">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedUnits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground text-xs">
                      No se encontraron unidades de medida.
                    </td>
                  </tr>
                ) : (
                  paginatedUnits.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold text-xs text-primary">{u.code}</td>
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${u.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleToggleUnit(u.id)}
                        >
                          {u.active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <TablePagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={filteredUnits.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogManagementPage;
