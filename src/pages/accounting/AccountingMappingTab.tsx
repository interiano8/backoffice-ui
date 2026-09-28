import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  Building2, 
  HelpCircle,
  Fuel,
  CreditCard,
  ShoppingBag,
  Percent,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  accountingService, 
  AccountingMappingItem, 
  AccountItem, 
  CostCenterItem 
} from '../../services/accounting.service';

const CATEGORIES = [
  { key: 'ALL', label: 'Todas las Categorías', icon: Sliders },
  { key: 'PAYMENT_METHOD', label: 'Formas de Pago', icon: CreditCard },
  { key: 'FUEL', label: 'Combustibles', icon: Fuel },
  { key: 'PRODUCT', label: 'Tienda / Productos', icon: ShoppingBag },
  { key: 'TAX', label: 'Impuestos (ISV)', icon: Percent },
  { key: 'DIFFERENCE', label: 'Faltantes / Sobrantes', icon: Scale },
];

const PRESET_IDENTIFIERS: Record<string, { id: string; label: string }[]> = {
  PAYMENT_METHOD: [
    { id: 'CASH', label: 'CASH (Efectivo / Caja General)' },
    { id: 'CARD', label: 'CARD (Tarjetas Débito / Crédito)' },
    { id: 'CREDIT', label: 'CREDIT (Ventas a Crédito / Clientes)' },
    { id: 'TRANSFER', label: 'TRANSFER (Transferencias Bancarias)' },
    { id: 'CHECK', label: 'CHECK (Cheques)' },
  ],
  FUEL: [
    { id: 'SUPERIOR', label: 'SUPERIOR (Gasolina Superior)' },
    { id: 'REGULAR', label: 'REGULAR (Gasolina Regular)' },
    { id: 'DIESEL', label: 'DIESEL (Diésel)' },
    { id: 'KEROSENE', label: 'KEROSENE (Queroseno)' },
  ],
  PRODUCT: [
    { id: 'STORE_SALE', label: 'STORE_SALE (Ventas de Tienda / Conveniencia)' },
    { id: 'STORE_COST', label: 'STORE_COST (Costo de Mercadería Tienda)' },
    { id: 'OIL_LUBRICANTS', label: 'OIL_LUBRICANTS (Aceites y Lubricantes)' },
  ],
  TAX: [
    { id: 'ISV15', label: 'ISV15 (Impuesto Sobre Ventas 15%)' },
    { id: 'ISV18', label: 'ISV18 (Impuesto Sobre Ventas 18%)' },
    { id: 'TAX_EXEMPT', label: 'TAX_EXEMPT (Exento de Impuestos)' },
  ],
  DIFFERENCE: [
    { id: 'SHORTAGE', label: 'SHORTAGE (Faltante de Caja / Pérdida)' },
    { id: 'SURPLUS', label: 'SURPLUS (Sobrante de Caja / Otros Ingresos)' },
  ],
};

export const AccountingMappingTab: React.FC = () => {
  const [mappings, setMappings] = useState<AccountingMappingItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState('PAYMENT_METHOD');
  const [formSourceIdentifier, setFormSourceIdentifier] = useState('');
  const [formAccountId, setFormAccountId] = useState('');
  const [formCostCenterId, setFormCostCenterId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [mapsData, accsData, ccData] = await Promise.all([
        accountingService.getMappings(categoryFilter !== 'ALL' ? categoryFilter : undefined),
        accountingService.getAccounts({ allowsMovement: true }),
        accountingService.getCostCenters(true),
      ]);
      setMappings(mapsData);
      setAccounts(accsData);
      setCostCenters(ccData);
    } catch (err: any) {
      toast.error('Error cargando configuración de mapeos: ' + (err.message || 'Error de conexión'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormCategory(categoryFilter !== 'ALL' ? categoryFilter : 'PAYMENT_METHOD');
    setFormSourceIdentifier('');
    setFormAccountId(accounts[0]?.id || '');
    setFormCostCenterId('');
    setDialogOpen(true);
  };

  const openEditDialog = (item: AccountingMappingItem) => {
    setEditingId(item.id);
    setFormCategory(item.category);
    setFormSourceIdentifier(item.sourceIdentifier);
    setFormAccountId(item.accountId);
    setFormCostCenterId(item.costCenterId || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formCategory || !formSourceIdentifier.trim() || !formAccountId) {
      toast.error('Categoría, Identificador y Cuenta Contable son obligatorios');
      return;
    }

    setSaving(true);
    try {
      await accountingService.setMapping({
        category: formCategory,
        sourceIdentifier: formSourceIdentifier.trim().toUpperCase(),
        accountId: formAccountId,
        costCenterId: formCostCenterId || undefined,
      });

      toast.success('Mapeo contable guardado exitosamente');
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al guardar mapeo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la regla de mapeo "${name}"?`)) return;
    try {
      await accountingService.deleteMapping(id);
      toast.success('Mapeo contable eliminado');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al eliminar');
    }
  };

  const filteredMappings = mappings.filter((m) => {
    const matchesSearch =
      m.sourceIdentifier.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.account?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.account?.code.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'PAYMENT_METHOD':
        return <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10">Forma de Pago</Badge>;
      case 'FUEL':
        return <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10">Combustible</Badge>;
      case 'PRODUCT':
        return <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">Tienda / Prod</Badge>;
      case 'TAX':
        return <Badge variant="outline" className="border-purple-500/30 text-purple-500 bg-purple-500/10">Impuestos</Badge>;
      case 'DIFFERENCE':
        return <Badge variant="outline" className="border-rose-500/30 text-rose-500 bg-rose-500/10">Diferencias</Badge>;
      default:
        return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-6 bg-card/60 border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Mapeos Contables Operativos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Define a qué cuenta contable se imputan automáticamente las ventas de combustible, formas de pago, tienda y diferencias de arqueo.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Nueva Regla de Mapeo
          </Button>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 border-t border-border/40 pt-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = categoryFilter === cat.key;
            return (
              <Button
                key={cat.key}
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(cat.key)}
                className={`text-xs flex items-center gap-1.5 transition-all ${
                  active ? 'shadow-md shadow-primary/20' : 'bg-background/40 hover:bg-muted/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Search and Table */}
      <Card className="p-6 bg-card/60 border-border/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por identificador o cuenta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {filteredMappings.length} reglas registradas
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Cargando reglas de mapeo...</span>
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="py-12 text-center border border-dashed rounded-lg border-border/60">
            <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No se encontraron reglas de mapeo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Agrega una regla para automatizar la contabilización de este tipo de transacciones.
            </p>
          </div>
        ) : (
          <div className="border border-border/40 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Identificador Operativo</th>
                  <th className="py-3 px-4">Cuenta Contable Asignada</th>
                  <th className="py-3 px-4">Centro de Costo</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredMappings.map((map) => (
                  <tr key={map.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">{getCategoryBadge(map.category)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {map.sourceIdentifier}
                    </td>
                    <td className="py-3 px-4">
                      {map.account ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-primary">
                            {map.account.code}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {map.account.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-destructive flex items-center gap-1 font-mono">
                          ID: {map.accountId} (No encontrada)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {map.costCenter ? (
                        <Badge variant="outline" className="text-xs font-normal">
                          <Building2 className="w-3 h-3 mr-1 text-primary" />
                          {map.costCenter.code} - {map.costCenter.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic font-mono">
                          🌐 Todas las Tiendas (Global)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDialog(map)}
                          title="Editar regla"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(map.id, `${map.category} - ${map.sourceIdentifier}`)}
                          title="Eliminar regla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Crear / Editar Regla */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Sliders className="w-5 h-5 text-primary" />
              {editingId ? 'Editar Regla de Mapeo' : 'Nueva Regla de Mapeo Contable'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Categoría Operativa
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={formCategory}
                onChange={(e) => {
                  setFormCategory(e.target.value);
                  setFormSourceIdentifier('');
                }}
              >
                <option value="PAYMENT_METHOD">Forma de Pago (CASH, CARD, CREDIT...)</option>
                <option value="FUEL">Combustible (SUPERIOR, REGULAR, DIESEL...)</option>
                <option value="PRODUCT">Tienda / Productos (STORE_SALE, STORE_COST...)</option>
                <option value="TAX">Impuestos (ISV15, ISV18...)</option>
                <option value="DIFFERENCE">Diferencias Arqueo (SHORTAGE, SURPLUS)</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Identificador Operativo
              </label>
              {PRESET_IDENTIFIERS[formCategory] ? (
                <div className="space-y-2">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    value={formSourceIdentifier}
                    onChange={(e) => setFormSourceIdentifier(e.target.value)}
                  >
                    <option value="">-- Seleccionar o escribir abajo --</option>
                    {PRESET_IDENTIFIERS[formCategory].map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="O ingresa un código personalizado..."
                    value={formSourceIdentifier}
                    onChange={(e) => setFormSourceIdentifier(e.target.value.toUpperCase())}
                    className="font-mono text-xs uppercase"
                  />
                </div>
              ) : (
                <Input
                  placeholder="Ej: SUPERIOR, CASH, ISV15..."
                  value={formSourceIdentifier}
                  onChange={(e) => setFormSourceIdentifier(e.target.value.toUpperCase())}
                  className="font-mono uppercase text-sm"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Cuenta Contable (Solo cuentas de detalle con movimiento)
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                value={formAccountId}
                onChange={(e) => setFormAccountId(e.target.value)}
              >
                <option value="">-- Seleccionar Cuenta Contable --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({acc.nature === 'DEBIT' ? 'Deudora' : 'Acreedora'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Los movimientos contables automáticos debitarán o acreditarán esta cuenta según la naturaleza de la transacción.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Centro de Costo (Opcional)
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={formCostCenterId}
                onChange={(e) => setFormCostCenterId(e.target.value)}
              >
                <option value="">🌐 Global (Aplica para todas las estaciones)</option>
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Regla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
