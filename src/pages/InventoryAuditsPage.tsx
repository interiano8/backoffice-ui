import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  XCircle,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Save,
  CheckCheck,
  AlertTriangle,
  ArrowRightLeft,
  SlidersHorizontal,
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
  inventoryAuditService,
  InventoryCountSession,
  LowStockAlertItem,
} from '../services/inventory-audit.service';
import { transfersService } from '../services/transfers.service';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

const SHRINKAGE_REASONS = [
  { value: 'MERMA_ROTURA', label: 'Rotura o Daño Físico' },
  { value: 'MERMA_VENCIMIENTO', label: 'Caducidad / Vencimiento' },
  { value: 'CONSUMO_INTERNO', label: 'Consumo Interno' },
  { value: 'DESCUADRE_FISICO', label: 'Descuadre / Pérdida' },
];

export const InventoryAuditsPage: React.FC = () => {
  const { stores } = useAppStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'AUDITS' | 'ALERTS'>('AUDITS');
  const [sessions, setSessions] = useState<InventoryCountSession[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL');

  // Modal nueva sesión
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [storeCode, setStoreCode] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Modal detalle / conteo activo
  const [activeSession, setActiveSession] = useState<InventoryCountSession | null>(null);
  const [editedItems, setEditedItems] = useState<Record<string, { countedStock: number; reason: string; notes: string }>>({});
  const [itemSearchFilter, setItemSearchFilter] = useState('');
  const [savingItems, setSavingItems] = useState(false);
  const [applying, setApplying] = useState(false);

  // Modal ajustar umbral de stock mínimo
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [thresholdItem, setThresholdItem] = useState<LowStockAlertItem | null>(null);
  const [newMinStock, setNewMinStock] = useState<number>(0);
  const [savingThreshold, setSavingThreshold] = useState(false);

  // Modal reabastecer vía traspaso
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [reorderItem, setReorderItem] = useState<LowStockAlertItem | null>(null);
  const [sourceStore, setSourceStore] = useState<string>('');
  const [reorderQty, setReorderQty] = useState<number>(0);
  const [creatingTransfer, setCreatingTransfer] = useState(false);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'AUDITS') {
        const params: any = {};
        if (selectedStoreFilter !== 'ALL') params.storeCode = selectedStoreFilter;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        const data = await inventoryAuditService.getSessions(params);
        setSessions(data);
      } else {
        const store = selectedStoreFilter !== 'ALL' ? selectedStoreFilter : undefined;
        const data = await inventoryAuditService.getLowStockAlerts(store);
        setLowStockAlerts(data);
      }
    } catch (err: any) {
      toast.error('Error al cargar datos de inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedStoreFilter, statusFilter]);


  const handleOpenDetail = async (session: InventoryCountSession) => {
    try {
      const fresh = await inventoryAuditService.getSessionById(session.id);
      setActiveSession(fresh);

      // Pre-cargar edited items
      const map: Record<string, { countedStock: number; reason: string; notes: string }> = {};
      fresh.items.forEach((it) => {
        map[it.productCode] = {
          countedStock: Number(it.countedStock),
          reason: it.reason || 'DESCUADRE_FISICO',
          notes: it.notes || '',
        };
      });
      setEditedItems(map);
    } catch (err) {
      toast.error('No se pudo cargar el detalle de la sesión');
    }
  };

  const handleCreateSession = async () => {
    if (!storeCode) {
      toast.error('Selecciona una sucursal');
      return;
    }
    setCreating(true);
    try {
      const created = await inventoryAuditService.createSession({
        storeCode,
        countedBy: user?.username || 'AUDITOR',
        notes: sessionNotes.trim() || undefined,
      });
      toast.success(`Sesión ${created.sessionNo} iniciada exitosamente`);
      setCreateModalOpen(false);
      setStoreCode('');
      setSessionNotes('');
      await loadData();
      handleOpenDetail(created);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión de conteo');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveCounts = async () => {
    if (!activeSession) return;
    setSavingItems(true);
    try {
      const payload = activeSession.items.map((it) => ({
        productCode: it.productCode,
        productName: it.productName,
        countedStock: Number(editedItems[it.productCode]?.countedStock ?? it.theoreticalStock),
        reason: editedItems[it.productCode]?.reason,
        notes: editedItems[it.productCode]?.notes,
      }));

      const updated = await inventoryAuditService.updateSessionItems(activeSession.id, payload);
      setActiveSession(updated);
      toast.success('Conteos guardados y calculados');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar conteos');
    } finally {
      setSavingItems(false);
    }
  };

  const handleApplySession = async () => {
    if (!activeSession) return;
    setApplying(true);
    try {
      const updated = await inventoryAuditService.applyAdjustments(activeSession.id, {
        approvedBy: user?.username || 'SUPERVISOR',
      });
      setActiveSession(updated);
      toast.success('¡Ajuste aplicado! El inventario físico ha sido sincronizado.');
      await loadData();

    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al aplicar ajustes de inventario');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;
    try {
      const updated = await inventoryAuditService.cancelSession(activeSession.id, 'Cancelado por usuario');
      setActiveSession(updated);
      toast.info('Sesión de conteo cancelada');
      await loadData();
    } catch (err: any) {
      toast.error('No se pudo cancelar la sesión');
    }
  };

  const handleUpdateThreshold = async () => {
    if (!thresholdItem) return;
    setSavingThreshold(true);
    try {
      await inventoryAuditService.updateThresholds(thresholdItem.storeCode, [
        { productCode: thresholdItem.productCode, minStock: newMinStock },
      ]);
      toast.success(`Stock mínimo actualizado a ${newMinStock} para ${thresholdItem.productCode}`);
      setThresholdModalOpen(false);
      setThresholdItem(null);
      await loadData();
    } catch (err: any) {
      toast.error('Error al actualizar stock mínimo');
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleCreateReorderTransfer = async () => {
    if (!reorderItem || !sourceStore || reorderQty <= 0) {
      toast.error('Verifica la sucursal de origen y la cantidad');
      return;
    }
    setCreatingTransfer(true);
    try {
      const created = await transfersService.createTransfer({
        fromStoreCode: sourceStore,
        toStoreCode: reorderItem.storeCode,
        requestedBy: user?.username || 'ENCARGADO_TIENDA',
        notes: `Reabastecimiento automático por alerta de bajo stock (${reorderItem.criticality})`,
        items: [
          {
            productCode: reorderItem.productCode,
            productName: reorderItem.productName,
            quantity: reorderQty,
          },
        ],
      });
      toast.success(`¡Traspaso ${created.transferNo} solicitado con éxito!`);
      setReorderModalOpen(false);
      setReorderItem(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al generar traspaso de reabastecimiento');
    } finally {
      setCreatingTransfer(false);
    }
  };

  // Filtrado local de lista
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.sessionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.storeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.countedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredAlerts = lowStockAlerts.filter((a) => {
    const matchesSearch =
      a.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.storeCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">Borrador</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="border-blue-500/50 text-blue-500 bg-blue-500/10">Contado / Listo</Badge>;
      case 'APPLIED':
        return <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">Aplicado</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="border-rose-500/50 text-rose-500 bg-rose-500/10">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCriticalityBadge = (crit: string) => {
    switch (crit) {
      case 'OUT_OF_STOCK':
        return <Badge variant="destructive" className="bg-red-600 text-white font-bold">AGOTADO</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-amber-600 text-white font-semibold">CRÍTICO</Badge>;
      case 'WARNING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-500/10">BAJO MÍNIMO</Badge>;
      default:
        return <Badge variant="outline">{crit}</Badge>;
    }
  };


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Control de Inventario y Abastecimiento
          </h1>
          <p className="text-muted-foreground text-sm">
            Auditorías físicas de existencias, control de mermas y alertas inteligentes de reabastecimiento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {activeTab === 'AUDITS' && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Conteo Físico
            </Button>
          )}
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab('AUDITS')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'AUDITS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Auditorías y Mermas ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'ALERTS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas de Stock Bajo ({lowStockAlerts.length})
        </button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'AUDITS' ? "Buscar por sesión o auditor..." : "Buscar por código o producto..."}
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
                  <SelectItem value="ALL">Todas las sucursales</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeTab === 'AUDITS' && (
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="COMPLETED">Contado / Listo</SelectItem>
                    <SelectItem value="APPLIED">Aplicado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab 1: Tabla de Sesiones */}
      {activeTab === 'AUDITS' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                Sesiones de Conteo Registradas ({filteredSessions.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-muted-foreground">Sesión</th>
                    <th className="p-4 font-medium text-muted-foreground">Sucursal</th>
                    <th className="p-4 font-medium text-muted-foreground">Auditor</th>
                    <th className="p-4 font-medium text-muted-foreground">Productos</th>
                    <th className="p-4 font-medium text-muted-foreground">Estado</th>
                    <th className="p-4 font-medium text-muted-foreground">Fecha</th>
                    <th className="p-4 font-medium text-muted-foreground text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No se encontraron sesiones de conteo físico.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((s) => {
                      const storeObj = stores.find((st) => st.code === s.storeCode);
                      return (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-mono font-medium">{s.sessionNo}</td>
                          <td className="p-4">
                            <span className="font-semibold">{s.storeCode}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({storeObj?.name || 'Tienda'})
                            </span>
                          </td>
                          <td className="p-4">{s.countedBy}</td>
                          <td className="p-4">{s.items?.length || 0} ítems</td>
                          <td className="p-4">{getStatusBadge(s.status)}</td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => handleOpenDetail(s)}>
                              Ver Conteo
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Tabla de Alertas de Stock Bajo y Reorden */}
      {activeTab === 'ALERTS' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Productos que Requieren Reabastecimiento ({filteredAlerts.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Artículos por debajo o al límite del stock de seguridad configurado.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-muted-foreground">Criticidad</th>
                    <th className="p-4 font-medium text-muted-foreground">Sucursal</th>
                    <th className="p-4 font-medium text-muted-foreground">Código</th>
                    <th className="p-4 font-medium text-muted-foreground">Descripción</th>
                    <th className="p-4 font-medium text-muted-foreground text-center">Stock Actual</th>
                    <th className="p-4 font-medium text-muted-foreground text-center">Mínimo</th>
                    <th className="p-4 font-medium text-muted-foreground text-center">Sugerido Reorden</th>
                    <th className="p-4 font-medium text-muted-foreground text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        ¡Todo en orden! No hay productos bajo el stock mínimo en las sucursales seleccionadas.
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">{getCriticalityBadge(item.criticality)}</td>
                        <td className="p-4">
                          <span className="font-semibold">{item.storeCode}</span>
                          <span className="text-xs text-muted-foreground ml-1">({item.storeName})</span>
                        </td>
                        <td className="p-4 font-mono font-medium text-xs">{item.productCode}</td>
                        <td className="p-4 font-medium">{item.productName || '—'}</td>
                        <td className="p-4 text-center font-mono font-bold">
                          <span className={item.stock <= 0 ? 'text-red-500' : 'text-amber-500'}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-muted-foreground">{item.minStock}</td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="font-mono bg-blue-500/10 text-blue-500 border-blue-500/30">
                            +{item.suggestedReorder}
                          </Badge>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setThresholdItem(item);
                              setNewMinStock(item.minStock);
                              setThresholdModalOpen(true);
                            }}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                            Ajustar Mínimo
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => {
                              setReorderItem(item);
                              setReorderQty(item.suggestedReorder);
                              setSourceStore('');
                              setReorderModalOpen(true);
                            }}
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                            Pedir Traspaso
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Modal Crear Nueva Sesión */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Iniciar Conteo Físico de Inventario</DialogTitle>
            <DialogDescription>
              Se capturará un snapshot del inventario teórico actual de la sucursal seleccionada para auditar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Sucursal a Auditar</label>
              <Select value={storeCode} onValueChange={setStoreCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notas / Observaciones</label>
              <Input
                placeholder="Ej. Auditoría de fin de mes, revisión de mermas"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSession} disabled={creating || !storeCode}>
              {creating ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle / Hoja de Conteo Físico */}
      <Dialog open={!!activeSession} onOpenChange={(open) => !open && setActiveSession(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="border-b pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <span>Hoja de Conteo: {activeSession?.sessionNo}</span>
                  {activeSession && getStatusBadge(activeSession.status)}
                </DialogTitle>
                <DialogDescription>
                  Sucursal {activeSession?.storeCode} | Auditor: {activeSession?.countedBy} | Creado: {activeSession?.createdAt ? new Date(activeSession.createdAt).toLocaleString() : ''}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {activeSession?.status !== 'APPLIED' && activeSession?.status !== 'CANCELLED' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveCounts}
                      disabled={savingItems}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {savingItems ? 'Guardando...' : 'Guardar Conteos'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplySession}
                      disabled={applying}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      {applying ? 'Aplicando...' : 'Aplicar Ajuste Físico'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Buscador de ítems dentro de la sesión */}
          <div className="py-2 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por código o nombre de producto..."
                className="pl-9 h-9"
                value={itemSearchFilter}
                onChange={(e) => setItemSearchFilter(e.target.value)}
              />
            </div>
            {activeSession?.status !== 'APPLIED' && activeSession?.status !== 'CANCELLED' && (
              <Button variant="ghost" size="sm" onClick={handleCancelSession} className="text-rose-500 hover:text-rose-600">
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar Sesión
              </Button>
            )}
          </div>

          {/* Tabla de ítems con variance highlights */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/80 sticky top-0 z-10 border-b">
                <tr className="text-left">
                  <th className="p-3 font-medium">Código</th>
                  <th className="p-3 font-medium">Descripción</th>
                  <th className="p-3 font-medium text-center">Teórico</th>
                  <th className="p-3 font-medium text-center w-32">Físico Contado</th>
                  <th className="p-3 font-medium text-center">Diferencia</th>
                  <th className="p-3 font-medium w-48">Motivo de Merma</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeSession?.items
                  ?.filter((it) => {
                    const q = itemSearchFilter.toLowerCase();
                    return (
                      it.productCode.toLowerCase().includes(q) ||
                      (it.productName || '').toLowerCase().includes(q)
                    );
                  })
                  .map((it) => {
                    const edited = editedItems[it.productCode] || {
                      countedStock: Number(it.countedStock),
                      reason: it.reason || 'DESCUADRE_FISICO',
                      notes: it.notes || '',
                    };
                    const theo = Number(it.theoreticalStock);
                    const diff = edited.countedStock - theo;
                    const isReadOnly = activeSession.status === 'APPLIED' || activeSession.status === 'CANCELLED';

                    return (
                      <tr key={it.id || it.productCode} className="hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{it.productCode}</td>
                        <td className="p-3 font-medium">{it.productName || '—'}</td>
                        <td className="p-3 text-center font-mono font-semibold">{theo}</td>
                        <td className="p-3 text-center">
                          {isReadOnly ? (
                            <span className="font-mono font-semibold">{edited.countedStock}</span>
                          ) : (
                            <Input
                              type="number"
                              className="h-8 text-center font-mono"
                              value={edited.countedStock}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditedItems((prev) => ({
                                  ...prev,
                                  [it.productCode]: {
                                    ...prev[it.productCode],
                                    countedStock: val,
                                  },
                                }));
                              }}
                            />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                              diff === 0
                                ? 'text-muted-foreground bg-muted'
                                : diff < 0
                                ? 'text-rose-500 bg-rose-500/10'
                                : 'text-emerald-500 bg-emerald-500/10'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="p-3">
                          {diff !== 0 ? (
                            isReadOnly ? (
                              <Badge variant="outline" className="text-xs">
                                {SHRINKAGE_REASONS.find((r) => r.value === edited.reason)?.label || edited.reason}
                              </Badge>
                            ) : (
                              <Select
                                value={edited.reason}
                                onValueChange={(val) => {
                                  setEditedItems((prev) => ({
                                    ...prev,
                                    [it.productCode]: {
                                      ...prev[it.productCode],
                                      reason: val,
                                    },
                                  }));
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SHRINKAGE_REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                      {r.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <DialogFooter className="mt-4 pt-2 border-t">
            <Button variant="outline" onClick={() => setActiveSession(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajustar Stock Mínimo */}
      <Dialog open={thresholdModalOpen} onOpenChange={setThresholdModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Ajustar Stock Mínimo de Seguridad</DialogTitle>
            <DialogDescription>
              Define el umbral para activar advertencias y sugerencias de reabastecimiento en la sucursal {thresholdItem?.storeCode}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Producto</label>
              <p className="font-mono text-sm font-medium">{thresholdItem?.productCode} - {thresholdItem?.productName}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Nuevo Stock Mínimo</label>
              <Input
                type="number"
                min="0"
                value={newMinStock}
                onChange={(e) => setNewMinStock(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setThresholdModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateThreshold} disabled={savingThreshold}>
              {savingThreshold ? 'Guardando...' : 'Guardar Umbral'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pedir Traspaso de Reabastecimiento */}
      <Dialog open={reorderModalOpen} onOpenChange={setReorderModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Solicitar Traspaso de Reabastecimiento</DialogTitle>
            <DialogDescription>
              Genera una solicitud automática de traspaso hacia la tienda {reorderItem?.storeCode}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Artículo a Reabastecer</label>
              <p className="font-mono text-sm font-medium">{reorderItem?.productCode} - {reorderItem?.productName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stock actual: <strong className="text-red-500">{reorderItem?.stock}</strong> | Mínimo: {reorderItem?.minStock}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Sucursal de Origen (Quien despacha)</label>
              <Select value={sourceStore} onValueChange={setSourceStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona origen (ej. Bodega Central)" />
                </SelectTrigger>
                <SelectContent>
                  {stores
                    .filter((s) => s.code !== reorderItem?.storeCode)
                    .map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Cantidad a Solicitar</label>
              <Input
                type="number"
                min="1"
                value={reorderQty}
                onChange={(e) => setReorderQty(Math.max(1, parseFloat(e.target.value) || 1))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sugerencia óptima de reorden: <strong>+{reorderItem?.suggestedReorder}</strong> unidades.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReorderModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateReorderTransfer}
              disabled={creatingTransfer || !sourceStore || reorderQty <= 0}
              className="bg-primary text-primary-foreground"
            >
              {creatingTransfer ? 'Enviando Solicitud...' : 'Solicitar Traspaso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

