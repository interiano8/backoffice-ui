import React, { useState } from 'react';
import { Product, productsService } from '@/services/products.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, DollarSign, Globe, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  stores: Array<{ code: string; name: string }>;
  onSaved: () => void;
}

export const ProductPriceModal: React.FC<ProductPriceModalProps> = ({
  isOpen,
  onClose,
  product,
  stores,
  onSaved,
}) => {
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [storeCode, setStoreCode] = useState<string>('GLOBAL'); // 'GLOBAL' o código de tienda
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unitPrice === '' || Number(unitPrice) < 0) {
      toast.error('Ingresa un precio unitario válido');
      return;
    }
    if (!startDate) {
      toast.error('La fecha de inicio es requerida');
      return;
    }

    setLoading(true);
    try {
      await productsService.createPrice({
        productId: product.id,
        storeCode: storeCode === 'GLOBAL' ? null : storeCode,
        unitPrice: Number(unitPrice),
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
      });
      toast.success('Precio registrado correctamente');
      setUnitPrice('');
      setEndDate('');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error guardando precio');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrice = async (id: string) => {
    try {
      await productsService.togglePrice(id);
      onSaved();
    } catch (err: any) {
      toast.error('Error al actualizar estado del precio');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Precios por Fecha y Tienda: {product.code} - {product.description}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Formulario nuevo precio */}
          <form
            onSubmit={handleCreatePrice}
            className="bg-muted/30 p-4 rounded-lg border border-border space-y-3"
          >
            <h4 className="text-sm font-semibold">Registrar Nuevo Precio</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Precio Unitario (Lps.) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="h-9 font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Ámbito de Aplicación *
                </label>
                <select
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="GLOBAL">🌐 Todas las tiendas (Global)</option>
                  {stores.map((s) => (
                    <option key={s.code} value={s.code}>
                      🏪 Tienda {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Fecha Inicio Vigencia *
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Fecha Fin Vigencia (Opcional)
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={loading} className="h-9 gap-1">
                <Plus className="w-4 h-4" /> Agregar Precio
              </Button>
            </div>
          </form>

          {/* Historial de precios */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Precios Configurados</h4>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2 text-left">Ámbito</th>
                    <th className="p-2 text-right">Precio Unitario</th>
                    <th className="p-2 text-center">Vigencia</th>
                    <th className="p-2 text-center">Estado</th>
                    <th className="p-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!product.prices || product.prices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground italic">
                        No hay precios registrados para este producto.
                      </td>
                    </tr>
                  ) : (
                    product.prices.map((p) => {
                      const isGlobal = !p.storeCode;
                      const startStr = new Date(p.startDate).toLocaleDateString();
                      const endStr = p.endDate ? new Date(p.endDate).toLocaleDateString() : 'Indefinido';
                      return (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="p-2">
                            {isGlobal ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-blue-500">
                                <Globe className="w-3.5 h-3.5" /> Global
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                                <Building2 className="w-3.5 h-3.5" /> Tienda {p.storeCode}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-sm">
                            L {Number(p.unitPrice).toFixed(2)}
                          </td>
                          <td className="p-2 text-center text-muted-foreground">
                            {startStr} al {endStr}
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.active
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-rose-500/10 text-rose-500'
                              }`}
                            >
                              {p.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() => handleTogglePrice(p.id)}
                            >
                              {p.active ? 'Desactivar' : 'Activar'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
