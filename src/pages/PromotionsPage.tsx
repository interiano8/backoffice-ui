import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  Power,
  Trash2,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  promotionsService,
  Promotion,
} from '../services/promotions.service';
import { useAppStore } from '../store/useAppStore';

export const PromotionsPage: React.FC = () => {
  const { stores } = useAppStore();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('ALL');

  // Modal Crear Promoción
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'FIXED_PRICE_COMBO' | 'PERCENT_DISCOUNT'>('FIXED_PRICE_COMBO');
  const [fixedPrice, setFixedPrice] = useState<number>(0);
  const [discountPct, setDiscountPct] = useState<number>(10);
  const [storeCode, setStoreCode] = useState<string>('ALL');
  const [items, setItems] = useState<Array<{ productCode: string; productName: string; quantityRequired: number }>>([
    { productCode: '', productName: '', quantityRequired: 1 },
  ]);
  const [creating, setCreating] = useState(false);

  // Modal Simulador de Carrito
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simCart, setSimCart] = useState<Array<{ productCode: string; quantity: number; unitPrice: number }>>([
    { productCode: '', quantity: 1, unitPrice: 0 },
  ]);
  const [simResult, setSimResult] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const store = selectedStoreFilter !== 'ALL' ? selectedStoreFilter : undefined;
      const data = await promotionsService.getPromotions({ storeCode: store });
      setPromotions(data);
    } catch (err: any) {
      toast.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [selectedStoreFilter]);

  const handleCreate = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error('Ingresa código y nombre de la promoción');
      return;
    }
    const validItems = items.filter((it) => it.productCode.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Agrega al menos un producto a la promoción');
      return;
    }

    setCreating(true);
    try {
      await promotionsService.createPromotion({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        fixedPrice: type === 'FIXED_PRICE_COMBO' ? fixedPrice : undefined,
        discountPct: type === 'PERCENT_DISCOUNT' ? discountPct : undefined,
        storeCode: storeCode !== 'ALL' ? storeCode : undefined,
        items: validItems.map((it) => ({
          productCode: it.productCode.trim(),
          productName: it.productName.trim() || undefined,
          quantityRequired: it.quantityRequired,
        })),
      });

      toast.success(`Promoción ${code.toUpperCase()} creada con éxito`);
      setCreateModalOpen(false);
      setCode('');
      setName('');
      setDescription('');
      setItems([{ productCode: '', productName: '', quantityRequired: 1 }]);
      await loadPromotions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear promoción');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (p: Promotion) => {
    try {
      await promotionsService.togglePromotion(p.id);
      toast.success(`Promoción ${p.active ? 'desactivada' : 'activada'}`);
      await loadPromotions();
    } catch (err) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (p: Promotion) => {
    if (!confirm(`¿Eliminar la promoción ${p.name}?`)) return;
    try {
      await promotionsService.deletePromotion(p.id);
      toast.info('Promoción eliminada');
      await loadPromotions();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const handleEvaluateSim = async () => {
    const valid = simCart.filter((it) => it.productCode.trim() && it.unitPrice > 0);
    if (valid.length === 0) {
      toast.error('Ingresa productos con precio válido para simular');
      return;
    }
    setEvaluating(true);
    try {
      const res = await promotionsService.evaluateCart({
        items: valid,
      });
      setSimResult(res);
    } catch (err) {
      toast.error('Error al evaluar promociones');
    } finally {
      setEvaluating(false);
    }
  };

  const filteredPromos = promotions.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Promociones y Combos Retail
          </h1>
          <p className="text-muted-foreground text-sm">
            Configuración de paquetes promocionales (combos) y reglas automáticas de descuento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPromotions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="secondary" onClick={() => setSimulatorOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Simulador de Carrito
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Promoción
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select value={selectedStoreFilter} onValueChange={setSelectedStoreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las sucursales (Global)</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Promociones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg">
            No se encontraron promociones registradas. Haz clic en "Nueva Promoción" para comenzar.
          </div>
        ) : (
          filteredPromos.map((p) => (
            <Card key={p.id} className={`flex flex-col justify-between ${!p.active ? 'opacity-60 bg-muted/20' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-muted-foreground">{p.code}</span>
                    <h3 className="font-bold text-lg leading-tight mt-1">{p.name}</h3>
                  </div>
                  <Badge variant={p.active ? 'default' : 'outline'}>
                    {p.active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.type === 'FIXED_PRICE_COMBO' ? (
                      <Layers className="h-4 w-4 text-primary" />
                    ) : (
                      <Percent className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="text-xs font-semibold">
                      {p.type === 'FIXED_PRICE_COMBO' ? 'Precio Combo Fijo' : 'Descuento Porcentual'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-primary">
                    {p.type === 'FIXED_PRICE_COMBO'
                      ? `L. ${Number(p.fixedPrice || 0).toFixed(2)}`
                      : `${p.discountPct}% OFF`}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Productos del Paquete ({p.items?.length || 0})
                  </h4>
                  <div className="space-y-1">
                    {p.items?.map((it) => (
                      <div key={it.id || it.productCode} className="text-xs flex items-center justify-between">
                        <span className="font-medium truncate mr-2">
                          {it.productName || it.productCode}
                        </span>
                        <span className="font-mono text-muted-foreground">x{it.quantityRequired}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tienda: {p.storeCode ? p.storeCode : 'Todas (Red)'}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleToggle(p)}
                      title={p.active ? 'Desactivar' : 'Activar'}
                    >
                      <Power className={`h-4 w-4 ${p.active ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-rose-500 hover:text-rose-600"
                      onClick={() => handleDelete(p)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Crear Promoción */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Nueva Promoción o Combo Retail</DialogTitle>
            <DialogDescription>
              Configura paquetes de precio fijo o descuentos porcentuales sobre productos específicos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Código Identificador</label>
                <Input
                  placeholder="Ej. COMBO-DESAYUNO"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Nombre Promoción</label>
                <Input
                  placeholder="Ej. Café + Dona Especial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Tipo de Regla</label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_PRICE_COMBO">Precio Fijo Combo</SelectItem>
                    <SelectItem value="PERCENT_DISCOUNT">Descuento Porcentual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  {type === 'FIXED_PRICE_COMBO' ? 'Precio Final del Combo (L.)' : 'Porcentaje Descuento (%)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={type === 'FIXED_PRICE_COMBO' ? fixedPrice : discountPct}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (type === 'FIXED_PRICE_COMBO') setFixedPrice(val);
                    else setDiscountPct(val);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Sucursal Aplicable</label>
              <Select value={storeCode} onValueChange={setStoreCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las sucursales (Global)</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Productos requeridos */}
            <div className="space-y-2 border p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-muted-foreground">Productos Requeridos</label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setItems([...items, { productCode: '', productName: '', quantityRequired: 1 }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar Producto
                </Button>
              </div>

              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Código (ej. CAFE-01)"
                      className="h-8 text-xs font-mono"
                      value={it.productCode}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].productCode = e.target.value;
                        setItems(copy);
                      }}
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      placeholder="Nombre (opcional)"
                      className="h-8 text-xs"
                      value={it.productName}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].productName = e.target.value;
                        setItems(copy);
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      className="h-8 text-xs text-center font-mono"
                      value={it.quantityRequired}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].quantityRequired = parseInt(e.target.value) || 1;
                        setItems(copy);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating || !code || !name}>
              {creating ? 'Guardando...' : 'Crear Promoción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Simulador de Carrito */}
      <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Simulador de Evaluación de Promociones
            </DialogTitle>
            <DialogDescription>
              Comprueba en tiempo real cómo el motor evalúa un carrito de compras y calcula los descuentos automáticos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Líneas del Carrito</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setSimCart([...simCart, { productCode: '', quantity: 1, unitPrice: 0 }])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Línea
                </Button>
              </div>

              {simCart.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <Input
                    placeholder="Código producto"
                    className="col-span-6 h-8 text-xs font-mono"
                    value={it.productCode}
                    onChange={(e) => {
                      const copy = [...simCart];
                      copy[idx].productCode = e.target.value;
                      setSimCart(copy);
                    }}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    className="col-span-3 h-8 text-xs text-center"
                    value={it.quantity}
                    onChange={(e) => {
                      const copy = [...simCart];
                      copy[idx].quantity = parseFloat(e.target.value) || 1;
                      setSimCart(copy);
                    }}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Precio L."
                    className="col-span-3 h-8 text-xs text-right"
                    value={it.unitPrice}
                    onChange={(e) => {
                      const copy = [...simCart];
                      copy[idx].unitPrice = parseFloat(e.target.value) || 0;
                      setSimCart(copy);
                    }}
                  />
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleEvaluateSim} disabled={evaluating}>
              {evaluating ? 'Calculando...' : 'Evaluar Promociones'}
            </Button>

            {simResult && (
              <div className="p-4 bg-muted/60 rounded-lg space-y-2 border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal Original:</span>
                  <span className="font-mono">L. {simResult.originalSubtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-500 font-semibold">
                  <span>Descuentos Aplicados:</span>
                  <span className="font-mono">- L. {simResult.totalDiscount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Total Final a Cobrar:</span>
                  <span className="font-mono text-primary">L. {simResult.finalTotal?.toFixed(2)}</span>
                </div>

                {simResult.appliedPromotions?.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Reglas Activadas:</span>
                    {simResult.appliedPromotions.map((ap: any, i: number) => (
                      <div key={i} className="text-xs p-1.5 bg-background rounded flex justify-between items-center">
                        <div>
                          <strong>{ap.promotionName}</strong>
                          <div className="text-[10px] text-muted-foreground">{ap.details}</div>
                        </div>
                        <Badge variant="outline" className="font-mono text-emerald-500">
                          - L. {ap.discountAmount?.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimulatorOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
