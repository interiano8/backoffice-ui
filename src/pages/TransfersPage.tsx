import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  User,
  AlertCircle,
  AlertTriangle,
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
import { transfersService, StockTransfer } from '../services/transfers.service';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

interface ReceiveItemState {
  productCode: string;
  productName?: string;
  quantityDispatched: number;
  quantityReceived: number;
  reason: string;
  notes: string;
}

export const TransfersPage: React.FC = () => {
  const { stores, selectedStore } = useAppStore();
  const { user } = useAuthStore();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL');

  // Modal crear traspaso
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fromStore, setFromStore] = useState('');
  const [toStore, setToStore] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productCode: string; productName: string; quantity: number }>>([
    { productCode: '', productName: '', quantity: 1 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Modal cancelar traspaso
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [transferToCancel, setTransferToCancel] = useState<StockTransfer | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Modal recibir traspaso con verificación física y discrepancias
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [transferToReceive, setTransferToReceive] = useState<StockTransfer | null>(null);
  const [receiveItems, setReceiveItems] = useState<ReceiveItemState[]>([]);
  const [receiveGeneralNotes, setReceiveGeneralNotes] = useState('');
  const [submittingReceive, setSubmittingReceive] = useState(false);

  const isAdmin =
    user?.role?.toUpperCase().includes('ADMIN') ||
    user?.roles?.some((r) => r.toUpperCase().includes('ADMIN')) ||
    user?.usuario?.toUpperCase() === 'ADMIN';

  const canReceiveTransfer = (trf: StockTransfer | null): boolean => {
    if (!trf) return false;
    if (isAdmin) return true;
    if (!selectedStore || selectedStore.code === 'GLOBAL' || selectedStore.code === '000') return true;
    return selectedStore.code === trf.toStoreCode;
  };

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const data = await transfersService.getTransfers();
      setTransfers(data);
    } catch (err: any) {
      toast.error('Error al cargar traspasos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const handleApprove = async (transfer: StockTransfer) => {
    try {
      await transfersService.approveTransfer(transfer.id, user?.username || 'ADMIN');
      toast.success(`Traspaso ${transfer.transferNo} aprobado`);
      loadTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al aprobar traspaso');
    }
  };

  const handleDispatch = async (transfer: StockTransfer) => {
    try {
      await transfersService.dispatchTransfer(transfer.id, user?.username || 'ADMIN');
      toast.success(`Traspaso ${transfer.transferNo} despachado (stock origen descontado)`);
      loadTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al despachar traspaso');
    }
  };

  const handleOpenReceiveModal = (transfer: StockTransfer) => {
    setTransferToReceive(transfer);
    setReceiveItems(
      transfer.items.map((it) => {
        const dispatched = it.quantityDispatched ?? it.quantityRequested;
        return {
          productCode: it.productCode,
          productName: it.productName || it.productCode,
          quantityDispatched: dispatched,
          quantityReceived: dispatched,
          reason: 'FALTANTE_NO_LLEGO',
          notes: '',
        };
      }),
    );
    setReceiveGeneralNotes('');
    setReceiveModalOpen(true);
  };

  const handleUpdateReceiveQty = (index: number, qty: number) => {
    setReceiveItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const validQty = Math.max(0, isNaN(qty) ? 0 : qty);
        return { ...it, quantityReceived: validQty };
      }),
    );
  };

  const handleUpdateReceiveField = (index: number, field: 'reason' | 'notes', value: string) => {
    setReceiveItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, [field]: value } : it)),
    );
  };

  const hasAnyDiscrepancy = receiveItems.some(
    (it) => it.quantityReceived !== it.quantityDispatched,
  );

  const handleConfirmReceive = async () => {
    if (!transferToReceive) return;

    if (!canReceiveTransfer(transferToReceive)) {
      toast.error(
        `Acceso no autorizado: Solo el personal de la sucursal receptora (${transferToReceive.toStoreCode}) o Administradores pueden recibir este traspaso.`,
      );
      return;
    }

    setSubmittingReceive(true);
    try {
      const itemsPayload = receiveItems.map((it) => ({
        productCode: it.productCode,
        quantity: it.quantityReceived,
        reason: it.quantityReceived !== it.quantityDispatched ? it.reason : undefined,
        notes: it.quantityReceived !== it.quantityDispatched ? it.notes : undefined,
      }));

      const overallDiscrepancyReason = hasAnyDiscrepancy
        ? receiveItems.find((it) => it.quantityReceived !== it.quantityDispatched)?.reason || 'DISCREPANCIA_CONTEO'
        : undefined;

      const res = await transfersService.receiveTransfer(transferToReceive.id, {
        receivedBy: user?.username || 'ADMIN',
        discrepancyReason: overallDiscrepancyReason,
        discrepancyNotes: receiveGeneralNotes.trim() || undefined,
        items: itemsPayload,
      });

      if (res.status === 'RECEIVED_WITH_DISCREPANCY') {
        toast.warning(
          `Traspaso ${res.transferNo} recibido con DISCREPANCIA. Merma/ajuste asentado en auditoría.`,
        );
      } else {
        toast.success(`Traspaso ${res.transferNo} recibido exitosamente sin diferencias.`);
      }

      setReceiveModalOpen(false);
      setTransferToReceive(null);
      loadTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al procesar la recepción');
    } finally {
      setSubmittingReceive(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!transferToCancel) return;
    try {
      await transfersService.cancelTransfer(transferToCancel.id, cancelReason);
      toast.success(`Traspaso ${transferToCancel.transferNo} cancelado`);
      setCancelModalOpen(false);
      setTransferToCancel(null);
      setCancelReason('');
      loadTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cancelar traspaso');
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStore || !toStore) {
      toast.error('Seleccione sucursal de origen y destino');
      return;
    }
    if (fromStore === toStore) {
      toast.error('Origen y destino deben ser sucursales diferentes');
      return;
    }
    const validItems = items.filter((it) => it.productCode.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Agregue al menos un producto válido');
      return;
    }

    setSubmitting(true);
    try {
      const res = await transfersService.createTransfer({
        fromStoreCode: fromStore,
        toStoreCode: toStore,
        requestedBy: user?.username || 'ADMIN',
        notes,
        items: validItems,
      });
      toast.success(`Traspaso ${res.transferNo} creado exitosamente`);
      setCreateModalOpen(false);
      setFromStore('');
      setToStore('');
      setNotes('');
      setItems([{ productCode: '', productName: '', quantity: 1 }]);
      loadTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear solicitud de traspaso');
    } finally {
      setSubmitting(false);
    }
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { productCode: '', productName: '', quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    );
  };

  const filteredTransfers = transfers.filter((trf) => {
    const matchesStatus = statusFilter === 'ALL' || trf.status === statusFilter;
    const matchesStore =
      selectedStoreFilter === 'ALL' ||
      trf.fromStoreCode === selectedStoreFilter ||
      trf.toStoreCode === selectedStoreFilter;
    const matchesSearch =
      !searchQuery ||
      trf.transferNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trf.items.some(
        (it) =>
          it.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (it.productName && it.productName.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    return matchesStatus && matchesStore && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10">SOLICITADO</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/10">APROBADO</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="outline" className="border-purple-500/40 text-purple-500 bg-purple-500/10">EN TRÁNSITO</Badge>;
      case 'RECEIVED':
        return <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10">RECIBIDO</Badge>;
      case 'RECEIVED_WITH_DISCREPANCY':
        return (
          <Badge variant="outline" className="border-amber-500/60 text-amber-600 dark:text-amber-400 bg-amber-500/15 font-bold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            RECIBIDO C/ DISCREPANCIA
          </Badge>
        );
      case 'CANCELLED':
        return <Badge variant="outline" className="border-rose-500/40 text-rose-500 bg-rose-500/10">CANCELADO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStoreName = (code: string) => {
    const st = stores.find((s) => s.code === code);
    return st ? `${st.name} (${code})` : `Sucursal ${code}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Traspasos entre Sucursales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión y seguimiento de movimientos de mercancía entre estaciones y tiendas de la red.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTransfers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Traspaso
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-card/50 border-border/60">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por correlativo o producto..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los Estados</SelectItem>
                <SelectItem value="REQUESTED">Solicitados</SelectItem>
                <SelectItem value="APPROVED">Aprobados</SelectItem>
                <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
                <SelectItem value="RECEIVED">Recibidos Completos</SelectItem>
                <SelectItem value="RECEIVED_WITH_DISCREPANCY">Con Discrepancia</SelectItem>
                <SelectItem value="CANCELLED">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStoreFilter} onValueChange={setSelectedStoreFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las Sucursales</SelectItem>
                {stores.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Traspasos */}
      <div className="space-y-4">
        {loading && transfers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">Cargando traspasos...</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            No se encontraron solicitudes de traspaso con los filtros actuales.
          </div>
        ) : (
          filteredTransfers.map((trf) => (
            <Card key={trf.id} className="border-border/60 hover:border-primary/40 transition-colors">
              <CardHeader className="p-4 pb-2 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-foreground">
                      {trf.transferNo}
                    </span>
                    {getStatusBadge(trf.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(trf.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {trf.requestedBy}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/20 p-2.5 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-muted-foreground">Origen (Despacha):</span>
                      <p className="font-semibold text-foreground">{getStoreName(trf.fromStoreCode)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-muted-foreground">Destino (Recibe):</span>
                      <p className="font-semibold text-foreground">{getStoreName(trf.toStoreCode)}</p>
                    </div>
                  </div>
                </div>

                {trf.notes && (
                  <p className="text-xs text-muted-foreground italic">
                    Notas: {trf.notes}
                  </p>
                )}

                {/* Items */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground text-left">
                        <th className="py-1.5 font-medium">Producto</th>
                        <th className="py-1.5 font-medium">Código</th>
                        <th className="py-1.5 font-medium text-right">Solicitado</th>
                        <th className="py-1.5 font-medium text-right">Despachado</th>
                        <th className="py-1.5 font-medium text-right">Recibido</th>
                        <th className="py-1.5 font-medium text-center">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trf.items.map((it) => {
                        const disp = it.quantityDispatched ?? it.quantityRequested;
                        const rec = it.quantityReceived;
                        const hasDiff = rec !== undefined && disp !== undefined && rec !== disp;
                        const diff = rec !== undefined && disp !== undefined ? rec - disp : null;

                        return (
                          <tr key={it.id || it.productCode} className="border-b border-border/20">
                            <td className="py-1.5 font-medium text-foreground">
                              {it.productName || it.productCode}
                            </td>
                            <td className="py-1.5 font-mono text-muted-foreground">
                              {it.productCode}
                            </td>
                            <td className="py-1.5 text-right font-mono font-semibold">
                              {it.quantityRequested}
                            </td>
                            <td className="py-1.5 text-right font-mono text-muted-foreground">
                              {it.quantityDispatched ?? '-'}
                            </td>
                            <td className="py-1.5 text-right font-mono font-semibold">
                              {it.quantityReceived !== undefined ? (
                                <span className={hasDiff ? 'text-amber-500 font-bold' : 'text-emerald-500'}>
                                  {it.quantityReceived}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-1.5 text-center font-mono">
                              {diff !== null && diff !== 0 ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] py-0 px-1.5 font-bold ${
                                    diff < 0
                                      ? 'border-rose-500/40 text-rose-500 bg-rose-500/10'
                                      : 'border-blue-500/40 text-blue-500 bg-blue-500/10'
                                  }`}
                                >
                                  {diff > 0 ? `+${diff}` : `${diff}`}
                                </Badge>
                              ) : diff === 0 ? (
                                <span className="text-[10px] text-muted-foreground">0</span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/30">
                  {trf.status === 'REQUESTED' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                        onClick={() => {
                          setTransferToCancel(trf);
                          setCancelModalOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar / Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleApprove(trf)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar Solicitud
                      </Button>
                    </>
                  )}

                  {trf.status === 'APPROVED' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                        onClick={() => {
                          setTransferToCancel(trf);
                          setCancelModalOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleDispatch(trf)}
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Despachar (Salida de Origen)
                      </Button>
                    </>
                  )}

                  {trf.status === 'IN_TRANSIT' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleOpenReceiveModal(trf)}
                    >
                      <PackageCheck className="h-4 w-4 mr-1" />
                      Confirmar Recepción y Conteo Físico
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Crear Traspaso */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Nueva Solicitud de Traspaso
            </DialogTitle>
            <DialogDescription>
              Inicie un movimiento formal de mercancía entre dos sucursales de la red.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTransfer} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Sucursal Origen (Emisora)</label>
                <Select value={fromStore} onValueChange={setFromStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Sucursal Destino (Receptora)</label>
                <Select value={toStore} onValueChange={setToStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Productos a Traspasar</label>
                <Button type="button" variant="ghost" size="sm" onClick={addItemRow} className="text-xs h-7">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar Fila
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Código Producto"
                      value={item.productCode}
                      onChange={(e) => updateItemRow(index, 'productCode', e.target.value)}
                      className="w-1/3 text-xs"
                      required
                    />
                    <Input
                      placeholder="Nombre (opcional)"
                      value={item.productName}
                      onChange={(e) => updateItemRow(index, 'productName', e.target.value)}
                      className="flex-1 text-xs"
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => updateItemRow(index, 'quantity', Number(e.target.value) || 1)}
                      className="w-20 text-xs text-center"
                      required
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600"
                        onClick={() => removeItemRow(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Observaciones / Motivo</label>
              <Input
                placeholder="Ej. Quiebre de stock por fin de semana"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Traspaso'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Recibir y Conteo Físico con Manejo de Discrepancias */}
      <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="h-5 w-5" />
              Recepción y Conteo Físico: {transferToReceive?.transferNo}
            </DialogTitle>
            <DialogDescription>
              Verifique el conteo real recibido en la estación de destino. Si la cantidad física difiere de lo despachado, ingrese la causa para registrar la merma o ajuste.
            </DialogDescription>
          </DialogHeader>

          {transferToReceive && (
            <div className="space-y-4 pt-1">
              {/* Información Origen - Destino */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 p-2.5 rounded-lg border border-border/30">
                <div>
                  <span className="text-muted-foreground">Estación Despacho:</span>
                  <p className="font-semibold">{getStoreName(transferToReceive.fromStoreCode)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estación Recepción (Usted):</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {getStoreName(transferToReceive.toStoreCode)}
                  </p>
                </div>
              </div>

              {/* Validación de Tienda Autorizada */}
              {!canReceiveTransfer(transferToReceive) && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Restricción Operativa de Recepción</p>
                    <p className="mt-0.5">
                      Este traspaso sólo puede ser recibido físicamente por un usuario asignado a la estación receptora (
                      <strong>{transferToReceive.toStoreCode}</strong>) o por un Administrador Central.
                    </p>
                  </div>
                </div>
              )}

              {/* Tabla de Conteo Físico */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Conteo Físico de Productos Recibidos
                </label>
                <div className="border border-border/40 rounded-lg overflow-hidden divide-y divide-border/20">
                  {receiveItems.map((item, idx) => {
                    const diff = item.quantityReceived - item.quantityDispatched;
                    const hasDiscrepancy = diff !== 0;

                    return (
                      <div key={item.productCode} className="p-3 space-y-2 bg-card/60">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {item.productName}
                            </p>
                            <p className="text-[11px] font-mono text-muted-foreground">
                              Código: {item.productCode}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                Despachado
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground">
                                {item.quantityDispatched}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                Recibido Físico
                              </span>
                              <Input
                                type="number"
                                min={0}
                                value={item.quantityReceived}
                                onChange={(e) => handleUpdateReceiveQty(idx, parseInt(e.target.value) || 0)}
                                className={`w-20 h-8 text-center text-xs font-mono font-bold ${
                                  hasDiscrepancy ? 'border-amber-500 ring-amber-500/20' : ''
                                }`}
                              />
                            </div>

                            <div className="w-24 text-center">
                              {diff === 0 ? (
                                <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[10px]">
                                  Exacto
                                </Badge>
                              ) : diff < 0 ? (
                                <Badge variant="outline" className="border-rose-500/40 text-rose-600 bg-rose-500/10 text-[10px] font-bold">
                                  Faltan {Math.abs(diff)}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 text-[10px] font-bold">
                                  Sobran {diff}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Campos de discrepancia si hay diferencia */}
                        {hasDiscrepancy && (
                          <div className="pt-2 border-t border-border/20 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-amber-500/5 p-2 rounded">
                            <div>
                              <label className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                                Causa de la Discrepancia:
                              </label>
                              <Select
                                value={item.reason}
                                onValueChange={(val) => handleUpdateReceiveField(idx, 'reason', val)}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FALTANTE_NO_LLEGO">Faltante físico en bulto</SelectItem>
                                  <SelectItem value="PRODUCTO_DANADO">Mercancía dañada / merma</SelectItem>
                                  <SelectItem value="EXTRAVIO_TRANSPORTE">Extravío en transporte</SelectItem>
                                  <SelectItem value="SOBRANTE">Sobrante no solicitado</SelectItem>
                                  <SelectItem value="ERROR_CONTEO_ORIGEN">Error de conteo en origen</SelectItem>
                                  <SelectItem value="OTRO">Otro motivo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                                Observación específica:
                              </label>
                              <Input
                                placeholder="Ej. Empaque roto, falta 1 unidad..."
                                value={item.notes}
                                onChange={(e) => handleUpdateReceiveField(idx, 'notes', e.target.value)}
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advertencia de discrepancia global */}
              {hasAnyDiscrepancy && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Diferencia Física Detectada</p>
                    <p className="mt-0.5">
                      Este traspaso quedará registrado como{' '}
                      <strong>RECIBIDO CON DISCREPANCIA</strong>. El sistema registrará la merma o ajuste
                      en la bitácora de auditoría y notificará vía alerta a la administración central.
                    </p>
                  </div>
                </div>
              )}

              {/* Observaciones generales */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Notas Generales de Recepción (opcional)
                </label>
                <Input
                  placeholder="Ej. Recibido por transportista Juan Pérez, sello verificado..."
                  value={receiveGeneralNotes}
                  onChange={(e) => setReceiveGeneralNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceiveModalOpen(false)}
                  disabled={submittingReceive}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmReceive}
                  disabled={submittingReceive || !canReceiveTransfer(transferToReceive)}
                  className={`${
                    hasAnyDiscrepancy
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {submittingReceive
                    ? 'Procesando...'
                    : hasAnyDiscrepancy
                    ? 'Confirmar Recepción c/ Discrepancia'
                    : 'Confirmar Recepción Completa'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertCircle className="h-5 w-5" />
              Cancelar Traspaso {transferToCancel?.transferNo}
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea cancelar esta solicitud? La orden quedará anulada sin alterar el stock.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-muted-foreground">Motivo de Cancelación</label>
            <Input
              placeholder="Ej. Mercancía ya no requerida"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Confirmar Cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransfersPage;
