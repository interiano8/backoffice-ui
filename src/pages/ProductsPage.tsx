import React, { useState, useEffect } from 'react';
import {
  Product,
  Department,
  Category,
  Supplier,
  productsService,
} from '@/services/products.service';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package,
  Search,
  DollarSign,
  Edit,
  Barcode,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { TablePagination } from '@/components/TablePagination';
import { ProductFormModal } from './ProductFormModal';
import { ProductPriceModal } from './ProductPriceModal';
import { CatalogConfigModal } from './CatalogConfigModal';

export const ProductsPage: React.FC = () => {
  const { stores } = useAppStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modales
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceProduct, setPriceProduct] = useState<Product | null>(null);

  const [configModalOpen, setConfigModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, deps, cats, sups, uoms] = await Promise.all([
        productsService.getProducts({
          search: search || undefined,
          departmentId: selectedDeptFilter || undefined,
          categoryId: selectedCatFilter || undefined,
        }),
        productsService.getDepartments(),
        productsService.getCategories(),
        productsService.getSuppliers(),
        productsService.getUnitsOfMeasure(),
      ]);
      setProducts(prods);
      setDepartments(deps);
      setCategories(cats);
      setSuppliers(sups);
      setUnits(uoms);
    } catch (err: any) {
      toast.error('Error cargando catálogo de productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData();
  }, [selectedDeptFilter, selectedCatFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProduct(p);
    setProductModalOpen(true);
  };

  const handleOpenPrices = (p: Product) => {
    setPriceProduct(p);
    setPriceModalOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      await productsService.toggleProduct(id);
      toast.success('Estado actualizado');
      loadData();
    } catch (err: any) {
      toast.error('Error actualizando estado del producto');
    }
  };

  const paginatedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Catálogo Maestro de Productos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión de artículos, códigos de barra, clasificación por departamentos, proveedores múltiples y listas de precios por fecha/tienda.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setConfigModalOpen(true)}
            className="gap-2 text-xs"
          >
            <Layers className="w-4 h-4" /> Deptos / Categorías / Prov.
          </Button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por código SKU, descripción o código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button type="submit" variant="secondary" className="gap-1 h-10">
            Buscar
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos los departamentos</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            title="Recargar"
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground uppercase border-b border-border">
              <tr>
                <th className="p-3 text-left">SKU / Producto</th>
                <th className="p-3 text-left">Códigos de Barra</th>
                <th className="p-3 text-left">Clasificación</th>
                <th className="p-3 text-left">Proveedores</th>
                <th className="p-3 text-right">Precios Vigentes</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Cargando catálogo de productos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No se encontraron productos en el catálogo con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const activePrices = p.prices?.filter((pr) => pr.active) || [];
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      {/* SKU / Descripción */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-primary">{p.code}</div>
                        <div className="font-medium text-foreground">{p.description}</div>
                        <div className="text-[11px] text-muted-foreground">
                          UM: {p.unitOfMeasure} • ISV: {p.taxGroup}%
                        </div>
                      </td>

                      {/* Códigos de barra */}
                      <td className="p-3">
                        {!p.barcodes || p.barcodes.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Sin código</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.barcodes.map((bc) => (
                              <span
                                key={bc.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] border border-border"
                              >
                                <Barcode className="w-3 h-3 text-muted-foreground" /> {bc.barcode}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Clasificación */}
                      <td className="p-3">
                        <div className="text-xs font-semibold">
                          {p.department?.name || <span className="text-muted-foreground italic">Sin depto</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.category?.name || 'Sin categoría'}
                        </div>
                      </td>

                      {/* Proveedores */}
                      <td className="p-3">
                        {!p.suppliers || p.suppliers.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Sin proveedor</span>
                        ) : (
                          <div className="space-y-0.5">
                            {p.suppliers.map((s) => (
                              <div key={s.id} className="text-xs flex items-center gap-1.5">
                                <span className={s.isDefault ? 'font-bold text-primary' : 'text-muted-foreground'}>
                                  {s.supplier?.name || 'Proveedor'}
                                </span>
                                {s.isDefault && (
                                  <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">
                                    Habitual
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Precios Vigentes */}
                      <td className="p-3 text-right">
                        {activePrices.length === 0 ? (
                          <span className="text-xs text-rose-500 font-semibold">Sin precio</span>
                        ) : (
                          <div className="space-y-1">
                            {activePrices.slice(0, 2).map((pr) => (
                              <div key={pr.id} className="text-xs font-mono font-bold">
                                L {Number(pr.unitPrice).toFixed(2)}{' '}
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  {pr.storeCode ? `(Tda ${pr.storeCode})` : '(Global)'}
                                </span>
                              </div>
                            ))}
                            {activePrices.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{activePrices.length - 2} más...
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id)}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-opacity hover:opacity-80 ${
                            p.active
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {p.active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => handleOpenPrices(p)}
                            title="Gestionar precios por fecha y tienda"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Precios
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={products.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modales */}
      <ProductFormModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={selectedProduct}
        departments={departments}
        categories={categories}
        suppliers={suppliers}
        units={units}
        existingProducts={products}
        onSaved={loadData}
      />

      <ProductPriceModal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        product={priceProduct}
        stores={stores}
        onSaved={loadData}
      />

      <CatalogConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        departments={departments}
        categories={categories}
        suppliers={suppliers}
        onRefresh={loadData}
      />
    </div>
  );
};

export default ProductsPage;
