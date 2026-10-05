import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Store,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Building,
} from 'lucide-react';
import api from '@/infrastructure/api/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PaymentMethod {
  code: string;
  description: string;
  category: string;
  currency: string;
  generatesChange: boolean;
  invoiceCash: boolean;
  invoiceCredit: boolean;
  fuelOutflow: boolean;
  loyalty: boolean;
  requiresReference: boolean;
  image?: string | null;
  active: boolean;
  accountId?: string | null;
  commissionPct?: number | null;
  storeCodes: string[];
}

interface ExchangeRate {
  id: string;
  currency: string;
  rate: number;
  startDate: string;
  endDate?: string | null;
  active: boolean;
}

interface StoreItem {
  id: string;
  code: string;
  name: string;
}

export function PaymentMethodsPage() {
  const [activeTab, setActiveTab] = useState<'methods' | 'rates'>('methods');

  // Formas de Pago state
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);

  // Modal crear/editar forma de pago
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [savingMethod, setSavingMethod] = useState(false);
  const [createdNotification, setCreatedNotification] = useState<{ code: string; desc: string } | null>(null);

  const [methodForm, setMethodForm] = useState({
    description: '',
    category: 'EFECTIVO',
    currency: 'HNL',
    generatesChange: false,
    invoiceCash: true,
    invoiceCredit: false,
    fuelOutflow: false,
    loyalty: false,
    requiresReference: false,
    active: true,
    accountId: '',
    commissionPct: '0.00',
    storeCodes: [] as string[],
  });

  // Modal asignación de estaciones
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [methodToAssign, setMethodToAssign] = useState<PaymentMethod | null>(null);
  const [assignedStores, setAssignedStores] = useState<string[]>([]);
  const [savingAssign, setSavingAssign] = useState(false);

  // Tasas de cambio state
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [savingRate, setSavingRate] = useState(false);
  const [rateForm, setRateForm] = useState({
    currency: 'USD',
    rate: '24.80',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    active: true,
  });

  const loadData = useCallback(async () => {
    setLoadingMethods(true);
    setLoadingRates(true);
    try {
      const [pmRes, rateRes, storeRes] = await Promise.allSettled([
        api.get('/payment-methods'),
        api.get('/payment-methods/exchange-rates'),
        api.get('/stores'),
      ]);

      if (pmRes.status === 'fulfilled') {
        setMethods(pmRes.value.data || []);
      }
      if (rateRes.status === 'fulfilled') {
        setRates(rateRes.value.data || []);
      }
      if (storeRes.status === 'fulfilled') {
        setStores(storeRes.value.data || []);
      }
    } catch {
      toast.error('Error cargando catálogo de formas de pago y tasas de cambio');
    } finally {
      setLoadingMethods(false);
      setLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers Métodos de Pago
  const handleOpenCreateMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      description: '',
      category: 'TARJETA',
      currency: 'HNL',
      generatesChange: false,
      invoiceCash: true,
      invoiceCredit: false,
      fuelOutflow: false,
      loyalty: false,
      requiresReference: true,
      active: true,
      accountId: '',
      commissionPct: '2.50',
      storeCodes: stores.map((s) => s.code),
    });
    setMethodModalOpen(true);
  };

  const handleOpenEditMethod = (pm: PaymentMethod) => {
    setEditingMethod(pm);
    setMethodForm({
      description: pm.description,
      category: pm.category || 'EFECTIVO',
      currency: pm.currency || 'HNL',
      generatesChange: pm.generatesChange ?? false,
      invoiceCash: pm.invoiceCash ?? false,
      invoiceCredit: pm.invoiceCredit ?? false,
      fuelOutflow: pm.fuelOutflow ?? false,
      loyalty: pm.loyalty ?? false,
      requiresReference: pm.requiresReference ?? false,
      active: pm.active ?? true,
      accountId: pm.accountId || '',
      commissionPct: pm.commissionPct != null ? String(pm.commissionPct) : '0.00',
      storeCodes: pm.storeCodes || [],
    });
    setMethodModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.description.trim()) {
      toast.error('La descripción de la forma de pago es obligatoria');
      return;
    }

    setSavingMethod(true);
    try {
      const payload = {
        description: methodForm.description.trim(),
        category: methodForm.category,
        currency: methodForm.currency,
        generatesChange: methodForm.generatesChange,
        invoiceCash: methodForm.invoiceCash,
        invoiceCredit: methodForm.invoiceCredit,
        fuelOutflow: methodForm.fuelOutflow,
        loyalty: methodForm.loyalty,
        requiresReference: methodForm.requiresReference,
        active: methodForm.active,
        accountId: methodForm.accountId.trim() || undefined,
        commissionPct: Number(methodForm.commissionPct) || 0,
        storeCodes: methodForm.storeCodes,
      };

      if (editingMethod) {
        await api.put(`/payment-methods/${editingMethod.code}`, payload);
        toast.success(`Forma de pago ${editingMethod.code} actualizada correctamente`);
      } else {
        const res = await api.post('/payment-methods', payload);
        const assignedCode = res.data?.assignedCode || res.data?.code;
        setCreatedNotification({
          code: assignedCode,
          desc: methodForm.description.trim(),
        });
        toast.success(`Forma de pago creada con éxito. Código asignado: ${assignedCode}`);
      }
      setMethodModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar forma de pago');
    } finally {
      setSavingMethod(false);
    }
  };

  const handleDeleteMethod = async (code: string) => {
    if (!confirm(`¿Eliminar la forma de pago ${code}?`)) return;
    try {
      await api.delete(`/payment-methods/${code}`);
      toast.success(`Forma de pago ${code} eliminada`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar forma de pago');
    }
  };

  // Handlers Asignación de Estaciones
  const handleOpenAssignModal = (pm: PaymentMethod) => {
    setMethodToAssign(pm);
    setAssignedStores(pm.storeCodes || []);
    setAssignModalOpen(true);
  };

  const handleSaveAssignStores = async () => {
    if (!methodToAssign) return;
    setSavingAssign(true);
    try {
      await api.post(`/payment-methods/${methodToAssign.code}/assign-stores`, {
        storeCodes: assignedStores,
      });
      toast.success(`Estaciones actualizadas para ${methodToAssign.description}`);
      setAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error actualizando asignación de estaciones');
    } finally {
      setSavingAssign(false);
    }
  };

  const toggleStoreAssignment = (storeCode: string) => {
    setAssignedStores((prev) =>
      prev.includes(storeCode) ? prev.filter((c) => c !== storeCode) : [...prev, storeCode],
    );
  };

  // Handlers Tasas de Cambio
  const handleOpenCreateRate = () => {
    setEditingRate(null);
    setRateForm({
      currency: 'USD',
      rate: '24.80',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      active: true,
    });
    setRateModalOpen(true);
  };

  const handleOpenEditRate = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setRateForm({
      currency: rate.currency || 'USD',
      rate: String(rate.rate),
      startDate: rate.startDate ? rate.startDate.split('T')[0] : '',
      endDate: rate.endDate ? rate.endDate.split('T')[0] : '',
      active: rate.active ?? true,
    });
    setRateModalOpen(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.rate || Number(rateForm.rate) <= 0 || !rateForm.startDate) {
      toast.error('Ingrese una tasa válida y una fecha de inicio');
      return;
    }

    setSavingRate(true);
    try {
      const payload = {
        currency: rateForm.currency,
        rate: Number(rateForm.rate),
        startDate: rateForm.startDate,
        endDate: rateForm.endDate || undefined,
        active: rateForm.active,
      };

      if (editingRate) {
        await api.put(`/payment-methods/exchange-rates/${editingRate.id}`, payload);
        toast.success('Tasa de cambio actualizada correctamente');
      } else {
        await api.post('/payment-methods/exchange-rates', payload);
        toast.success('Nueva tasa de cambio registrada correctamente');
      }
      setRateModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar tasa de cambio');
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm('¿Eliminar esta tasa de cambio?')) return;
    try {
      await api.delete(`/payment-methods/exchange-rates/${id}`);
      toast.success('Tasa de cambio eliminada');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar tasa de cambio');
    }
  };

  const getRateStatusBadge = (r: ExchangeRate) => {
    if (!r.active) {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">Inactiva</Badge>;
    }
    const today = new Date().toISOString().split('T')[0];
    const start = r.startDate ? r.startDate.split('T')[0] : '';
    const end = r.endDate ? r.endDate.split('T')[0] : '';

    if (start > today) {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Programada</Badge>;
    }
    if (end && end < today) {
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Vencida</Badge>;
    }
    return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Vigente</Badge>;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Formas de Pago y Tasas de Cambio</h1>
            <p className="text-xs text-muted-foreground">
              Catálogo centralizado de formas de pago, asignación por estación y tasas de cambio del Dólar por rango de fecha
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loadingMethods || loadingRates}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingMethods || loadingRates ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {activeTab === 'methods' ? (
            <Button size="sm" onClick={handleOpenCreateMethod}>
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva Forma de Pago
            </Button>
          ) : (
            <Button size="sm" onClick={handleOpenCreateRate}>
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva Tasa USD
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'methods'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('methods')}
        >
          <CreditCard className="w-4 h-4" />
          Formas de Pago Centrales ({methods.length})
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'rates'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('rates')}
        >
          <DollarSign className="w-4 h-4" />
          Tasas de Cambio Dólar ({rates.length})
        </button>
      </div>

      {/* TAB 1: FORMAS DE PAGO */}
      {activeTab === 'methods' && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Catálogo de Métodos de Pago Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Categoría / Moneda</th>
                    <th className="p-3">Banderas POS</th>
                    <th className="p-3">% Comisión</th>
                    <th className="p-3">Cuenta Contable</th>
                    <th className="p-3">Estaciones Habilitadas</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {methods.map((pm) => (
                    <tr key={pm.code} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-primary">{pm.code}</td>
                      <td className="p-3 font-semibold text-foreground">{pm.description}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {pm.category} ({pm.currency})
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {pm.generaCambio && <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px]">Cambio</Badge>}
                          {pm.invoiceCash && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">Contado</Badge>}
                          {pm.invoiceCredit && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">Crédito</Badge>}
                          {pm.requiresReference && <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px]">Ref.</Badge>}
                          {pm.loyalty && <Badge className="bg-pink-500/10 text-pink-600 border-pink-500/30 text-[10px]">Leal</Badge>}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {pm.commissionPct != null ? `${Number(pm.commissionPct).toFixed(2)}%` : '0.00%'}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {pm.accountId || '—'}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1.5"
                          onClick={() => handleOpenAssignModal(pm)}
                        >
                          <Building className="w-3 h-3" />
                          <span>{pm.storeCodes?.length || 0} Estaciones</span>
                        </Button>
                      </td>
                      <td className="p-3">
                        {pm.active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditMethod(pm)}>
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger" onClick={() => handleDeleteMethod(pm.code)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {methods.length === 0 && !loadingMethods && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-muted-foreground">
                        No hay formas de pago registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: TASAS DE CAMBIO */}
      {activeTab === 'rates' && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Historial de Tasas de Cambio de Dólares por Rango de Fecha
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b">
                  <tr>
                    <th className="p-3">Moneda</th>
                    <th className="p-3">Tasa (HNL por USD)</th>
                    <th className="p-3">Fecha Inicio</th>
                    <th className="p-3">Fecha Fin</th>
                    <th className="p-3">Estado de Vigencia</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rates.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-bold font-mono text-primary">{r.currency}</td>
                      <td className="p-3 font-mono font-bold text-base text-foreground">
                        L. {Number(r.rate).toFixed(4)}
                      </td>
                      <td className="p-3 font-mono">{r.startDate ? r.startDate.split('T')[0] : '—'}</td>
                      <td className="p-3 font-mono">{r.endDate ? r.endDate.split('T')[0] : 'Indefinido'}</td>
                      <td className="p-3">{getRateStatusBadge(r)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditRate(r)}>
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger" onClick={() => handleDeleteRate(r.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rates.length === 0 && !loadingRates && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        No hay tasas de cambio registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NOTIFICACIÓN CÓDIGO ASIGNADO */}
      {createdNotification && (
        <Dialog open={!!createdNotification} onOpenChange={() => setCreatedNotification(null)}>
          <DialogContent className="max-w-md text-center">
            <DialogHeader>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-lg">Forma de Pago Creada</DialogTitle>
              <DialogDescription className="text-sm">
                Se ha registrado correctamente la forma de pago <strong>{createdNotification.desc}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Código Asignado por el Sistema</div>
              <div className="text-3xl font-mono font-extrabold text-emerald-600 mt-1">
                {createdNotification.code}
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full" onClick={() => setCreatedNotification(null)}>Entendido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL CREAR / EDITAR FORMA DE PAGO */}
      <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingMethod ? `Editar Forma de Pago ${editingMethod.code}` : 'Nueva Forma de Pago Central'}</DialogTitle>
            <DialogDescription>
              {editingMethod
                ? 'Modifique las propiedades contables y operativas de esta forma de pago'
                : 'El código será generado automáticamente por el sistema al guardar.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMethod} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-semibold">Descripción de la Forma de Pago *</Label>
              <Input
                id="desc"
                placeholder="Ej. Tarjeta BAC Visa"
                value={methodForm.description}
                onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat" className="text-xs font-semibold">Categoría POS</Label>
                <select
                  id="cat"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  value={methodForm.category}
                  onChange={(e) => setMethodForm({ ...methodForm, category: e.target.value })}
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TARJETA">TARJETA</option>
                  <option value="DÓLAR">DÓLAR</option>
                  <option value="CRÉDITO">CRÉDITO</option>
                  <option value="VALE">VALE</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="curr" className="text-xs font-semibold">Moneda Base</Label>
                <select
                  id="curr"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  value={methodForm.currency}
                  onChange={(e) => setMethodForm({ ...methodForm, currency: e.target.value })}
                >
                  <option value="HNL">HNL (Lempiras)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="comm" className="text-xs font-semibold">% Comisión Bancaria</Label>
                <Input
                  id="comm"
                  type="number"
                  step="0.01"
                  placeholder="2.50"
                  value={methodForm.commissionPct}
                  onChange={(e) => setMethodForm({ ...methodForm, commissionPct: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc" className="text-xs font-semibold">Cuenta Contable (ID/Código)</Label>
                <Input
                  id="acc"
                  placeholder="Ej. 1102-01"
                  value={methodForm.accountId}
                  onChange={(e) => setMethodForm({ ...methodForm, accountId: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comportamiento en Caja (Banderas POS)</Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methodForm.generatesChange}
                    onChange={(e) => setMethodForm({ ...methodForm, generatesChange: e.target.checked })}
                  />
                  <span>Genera Cambio en Caja</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methodForm.requiresReference}
                    onChange={(e) => setMethodForm({ ...methodForm, requiresReference: e.target.checked })}
                  />
                  <span>Requiere N° Referencia</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methodForm.invoiceCash}
                    onChange={(e) => setMethodForm({ ...methodForm, invoiceCash: e.target.checked })}
                  />
                  <span>Aplica a Venta Contado</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methodForm.invoiceCredit}
                    onChange={(e) => setMethodForm({ ...methodForm, invoiceCredit: e.target.checked })}
                  />
                  <span>Aplica a Venta Crédito</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setMethodModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingMethod}>{savingMethod ? 'Guardando…' : 'Guardar Forma de Pago'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL ASIGNACIÓN DE ESTACIONES */}
      {methodToAssign && (
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar Estaciones a {methodToAssign.description}</DialogTitle>
              <DialogDescription>
                Seleccione manualmente las estaciones donde esta forma de pago estará habilitada y activa en caja.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-3 max-h-60 overflow-y-auto">
              {stores.map((s) => {
                const isSelected = assignedStores.includes(s.code);
                return (
                  <div
                    key={s.code}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => toggleStoreAssignment(s.code)}
                  >
                    <div className="flex items-center gap-2">
                      <Store className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="text-xs font-bold text-foreground">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">Código: {s.code}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStoreAssignment(s.code)}
                      className="h-4 w-4 accent-primary"
                    />
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveAssignStores} disabled={savingAssign}>
                {savingAssign ? 'Guardando…' : 'Guardar Asignación'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL CREAR / EDITAR TASA DE CAMBIO */}
      <Dialog open={rateModalOpen} onOpenChange={setRateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRate ? 'Editar Tasa de Cambio' : 'Nueva Tasa de Cambio Dólar'}</DialogTitle>
            <DialogDescription>Defina la tasa de cambio HNL por USD y su rango de fechas de vigencia</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRate} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rateCurr" className="text-xs font-semibold">Moneda</Label>
                <Input id="rateCurr" value={rateForm.currency} disabled className="font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rateVal" className="text-xs font-semibold">Tasa (HNL por 1 USD) *</Label>
                <Input
                  id="rateVal"
                  type="number"
                  step="0.0001"
                  placeholder="24.80"
                  value={rateForm.rate}
                  onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })}
                  required
                  className="font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start" className="text-xs font-semibold">Fecha Inicio *</Label>
                <Input
                  id="start"
                  type="date"
                  value={rateForm.startDate}
                  onChange={(e) => setRateForm({ ...rateForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end" className="text-xs font-semibold">Fecha Fin (Opcional)</Label>
                <Input
                  id="end"
                  type="date"
                  value={rateForm.endDate}
                  onChange={(e) => setRateForm({ ...rateForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setRateModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingRate}>{savingRate ? 'Guardando…' : 'Guardar Tasa'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
