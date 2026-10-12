import React, { useState, useEffect } from 'react';
import {
  Product,
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
import { Plus, Trash2, Barcode, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null; // null si es nuevo
  departments: Department[];
  categories: Category[];
  suppliers: Supplier[];
  onSaved: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  departments,
  categories,
  suppliers,
  onSaved,
}) => {
  const isEditing = Boolean(product);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('UND');
  const [taxGroup, setTaxGroup] = useState('15');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);

  // Códigos de barra múltiples
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [newBarcode, setNewBarcode] = useState('');

  // Proveedores asociados
  const [selectedSuppliers, setSelectedSuppliers] = useState<
    Array<{ supplierId: string; supplierProductCode: string; isDefault: boolean }>
  >([]);
  const [newSupplierId, setNewSupplierId] = useState('');
  const [newSupplierProdCode, setNewSupplierProdCode] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setCode(product.code);
      setDescription(product.description);
      setDepartmentId(product.departmentId || '');
      setCategoryId(product.categoryId || '');
      setUnitOfMeasure(product.unitOfMeasure || 'UND');
      setTaxGroup(product.taxGroup || '15');
      setImageUrl(product.imageUrl || '');
      setActive(product.active);
      setBarcodes(product.barcodes?.map((b) => b.barcode) || []);
      setSelectedSuppliers(
        product.suppliers?.map((s) => ({
          supplierId: s.supplierId,
          supplierProductCode: s.supplierProductCode || '',
          isDefault: s.isDefault,
        })) || [],
      );
    } else {
      setCode('');
      setDescription('');
      setDepartmentId('');
      setCategoryId('');
      setUnitOfMeasure('UND');
      setTaxGroup('15');
      setImageUrl('');
      setActive(true);
      setBarcodes([]);
      setSelectedSuppliers([]);
    }
    setNewBarcode('');
    setNewSupplierId('');
    setNewSupplierProdCode('');
  }, [product, isOpen]);

  // Filtrar categorías que correspondan al departamento seleccionado (si se seleccionó uno)
  const filteredCategories = departmentId
    ? categories.filter((c) => c.departmentId === departmentId || !c.departmentId)
    : categories;

  const handleAddBarcode = () => {
    const trimmed = newBarcode.trim();
    if (!trimmed) return;
    if (barcodes.includes(trimmed)) {
      toast.error('Este código de barras ya está en la lista');
      return;
    }
    setBarcodes([...barcodes, trimmed]);
    setNewBarcode('');
  };

  const handleRemoveBarcode = (codeToRemove: string) => {
    setBarcodes(barcodes.filter((b) => b !== codeToRemove));
  };

  const handleAddSupplier = () => {
    if (!newSupplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (selectedSuppliers.some((s) => s.supplierId === newSupplierId)) {
      toast.error('Este proveedor ya está agregado');
      return;
    }
    const isFirst = selectedSuppliers.length === 0;
    setSelectedSuppliers([
      ...selectedSuppliers,
      {
        supplierId: newSupplierId,
        supplierProductCode: newSupplierProdCode.trim(),
        isDefault: isFirst,
      },
    ]);
    setNewSupplierId('');
    setNewSupplierProdCode('');
  };

  const handleRemoveSupplier = (supplierIdToRemove: string) => {
    const updated = selectedSuppliers.filter((s) => s.supplierId !== supplierIdToRemove);
    // Si eliminamos el habitual y quedan otros, poner el primero como habitual
    if (updated.length > 0 && !updated.some((s) => s.isDefault)) {
      updated[0].isDefault = true;
    }
    setSelectedSuppliers(updated);
  };

  const handleSetDefaultSupplier = (supplierId: string) => {
    setSelectedSuppliers(
      selectedSuppliers.map((s) => ({
        ...s,
        isDefault: s.supplierId === supplierId,
      })),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !description.trim()) {
      toast.error('Código y descripción son obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && product) {
        await productsService.updateProduct(product.id, {
          description: description.trim(),
          departmentId: departmentId || undefined,
          categoryId: categoryId || undefined,
          unitOfMeasure,
          taxGroup,
          imageUrl: imageUrl.trim() || undefined,
          active,
          barcodes,
          suppliers: selectedSuppliers,
        });
        toast.success('Producto actualizado exitosamente');
      } else {
        await productsService.createProduct({
          code: code.trim().toUpperCase(),
          description: description.trim(),
          departmentId: departmentId || undefined,
          categoryId: categoryId || undefined,
          unitOfMeasure,
          taxGroup,
          imageUrl: imageUrl.trim() || undefined,
          active,
          barcodes,
          suppliers: selectedSuppliers,
        });
        toast.success('Producto creado exitosamente');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error guardando producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? `Editar Producto: ${product?.code}` : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ficha General */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Código SKU *</label>
              <Input
                placeholder="SKU-1001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isEditing}
                className="font-mono uppercase h-9"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Descripción / Nombre *</label>
              <Input
                placeholder="Aceite 20W-50 1QT"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Departamento</label>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setCategoryId('');
                }}
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

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">(Sin categoría)</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Unidad de Medida</label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="UND">UND - Unidad</option>
                <option value="GL">GL - Galón</option>
                <option value="LT">LT - Litro</option>
                <option value="CJA">CJA - Caja</option>
                <option value="PAQ">PAQ - Paquete</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Impuesto (ISV)</label>
              <select
                value={taxGroup}
                onChange={(e) => setTaxGroup(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="15">15% - General</option>
                <option value="18">18% - Bebidas / Licores</option>
                <option value="EXENTO">Exento (0%)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">URL de Imagen</label>
              <Input
                placeholder="https://servidor.com/imagenes/producto.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Sección de Códigos de Barra */}
          <div className="bg-muted/10 p-4 rounded-lg border border-border space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Barcode className="w-4 h-4 text-primary" /> Códigos de Barra
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Escanear o escribir código (ej. 7501000123456)"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                className="font-mono h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBarcode();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddBarcode} className="h-9 gap-1">
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {barcodes.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  Sin códigos de barra asociados. Puedes agregar uno o más.
                </span>
              ) : (
                barcodes.map((bc) => (
                  <span
                    key={bc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-mono text-xs border border-border"
                  >
                    {bc}
                    <button
                      type="button"
                      onClick={() => handleRemoveBarcode(bc)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Sección de Proveedores Múltiples */}
          <div className="bg-muted/10 p-4 rounded-lg border border-border space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Proveedores Asociados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newSupplierId}
                onChange={(e) => setNewSupplierId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar proveedor...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Cód. Artículo Prov. (opcional)"
                value={newSupplierProdCode}
                onChange={(e) => setNewSupplierProdCode(e.target.value)}
                className="h-9 text-xs"
              />
              <Button type="button" variant="secondary" onClick={handleAddSupplier} className="h-9 gap-1">
                <Plus className="w-4 h-4" /> Asociar
              </Button>
            </div>

            <div className="space-y-1.5 pt-1">
              {selectedSuppliers.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  No hay proveedores asociados a este producto.
                </span>
              ) : (
                selectedSuppliers.map((sup) => {
                  const sInfo = suppliers.find((s) => s.id === sup.supplierId);
                  return (
                    <div
                      key={sup.supplierId}
                      className="flex items-center justify-between p-2 rounded-md bg-card border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{sInfo?.name || sup.supplierId}</span>
                        {sup.supplierProductCode && (
                          <span className="text-muted-foreground font-mono">
                            (Ref: {sup.supplierProductCode})
                          </span>
                        )}
                        {sup.isDefault && (
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                            Habitual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!sup.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultSupplier(sup.supplierId)}
                            className="text-[11px] text-muted-foreground hover:text-foreground underline"
                          >
                            Hacer habitual
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplier(sup.supplierId)}
                          className="text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {isEditing ? 'Actualizar Producto' : 'Guardar Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
