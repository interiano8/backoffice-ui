import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Check, Printer, Pencil, Lock, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useShiftStore } from '../store/useShiftStore';
import type { Shift } from '../types/api';
import { getShiftDetails, getFusionDetails, getUnifiedPayments, getUnifiedProducts, printShiftReport } from '../services/shift.service';
import { syncMultipleShifts } from '../services/sync.service';
import api from '../infrastructure/api/api-client';
import { exportElementToPdf } from '../services/pdf-export.service';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { PresentationModal } from "../components/PresentationModal";
import { AuditShiftModal } from "../components/AuditShiftModal";
import { ReconciliationToolbar } from "../components/ReconciliationToolbar";
import { FiscalAuditModal } from "../components/FiscalAuditModal";
import { PrintShiftReport, PrintBatchShiftsReport } from "../components/reports/ShiftReport";
import { calculateReconciliation } from '../domain/reconciliation';
import { useShiftSync } from '../hooks/useShiftSync';
import { FusionDetailsModal } from '../components/FusionDetailsModal';
import { SyncModal } from '../components/SyncModal';
import { UnifiedPaymentsModal } from '../components/UnifiedPaymentsModal';
import { UnifiedProductsModal } from '../components/UnifiedProductsModal';
import { ShiftDetailDialog } from '../components/ShiftDetailDialog';
import { formatCurrency, formatTimeLiteral, formatShiftDate } from '../lib/format';
import { Skeleton } from "@/components/ui/skeleton"

export const Reconciliation: React.FC = () => {
  const { shifts, getShifts } = useShiftStore();
  const { globalDate, user, selectedStore } = useAppStore();
  const [selectedShiftNo, setSelectedShiftNo] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCriteria, setSearchCriteria] = useState<'user' | 'pos' | 'fusion' | 'shift'>('user');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [shiftDetails, setShiftDetails] = useState<any>({ fuel: [], products: [], paymentMethods: [], tickets: [], documents: { invoicesCash: [], invoicesCredit: [], creditNotes: [], outflows: [] }, totalTaxes: 0 });
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<Shift | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [syncingDate, setSyncingDate] = useState(false);
  const {
    syncModalOpen, syncMessages, syncStatus,
    setSyncModalOpen, setSyncStatus, setSyncMessages
  } = useShiftSync(globalDate);

  const [fusionModalOpen, setFusionModalOpen] = useState(false);
  const [fusionDetails, setFusionDetailsData] = useState<any[]>([]);
  const [fusionValidationSummary, setFusionValidationSummary] = useState<any>(null);
  const [isLoadingFusion, setIsLoadingFusion] = useState(false);
  const [printMetadata, setPrintMetadata] = useState<any>(null);

  const [unifiedPayments, setUnifiedPayments] = useState<{ unified: any[]; byShift: any[] }>({ unified: [], byShift: [] });
  const [isUnifiedPaymentsOpen, setIsUnifiedPaymentsOpen] = useState(false);
  const [isLoadingUnified, setIsLoadingUnified] = useState(false);

  const [unifiedProducts, setUnifiedProducts] = useState<{ unified: any[]; byShift: any[] }>({ unified: [], byShift: [] });
  const [isUnifiedProductsOpen, setIsUnifiedProductsOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [batchPrintData, setBatchPrintData] = useState<{ shift: Shift; details: any }[]>([]);
  const [batchFusionData, setBatchFusionData] = useState<any[]>([]);

  const [presentationModalOpen, setPresentationModalOpen] = useState(false);
  const [selectedPresentationShift, setSelectedPresentationShift] = useState<Shift | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditShift, setSelectedAuditShift] = useState<Shift | null>(null);
  const [fiscalAuditOpen, setFiscalAuditOpen] = useState(false);
  const [shiftsLoading, setShiftsLoading] = useState(true);

  const logContainerRef = useRef<HTMLDivElement>(null);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [autoSyncStatus, setAutoSyncStatus] = useState<{ running: boolean; sinceDate: string | null }>({ running: false, sinceDate: null });

  useEffect(() => {
    const fetchCronStatus = async () => {
      try {
        const { data } = await api.get('/etl/cron-status');
        setAutoSyncStatus({ running: data.running, sinceDate: data.sinceDate });
      } catch {}
    };
    fetchCronStatus();
    const interval = setInterval(fetchCronStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [syncMessages]);

  useEffect(() => {
    const load = async () => {
      setShiftsLoading(true);
      if (globalDate) {
        await getShifts(globalDate);
        setLastRefreshedAt(new Date());
      }
      setShiftsLoading(false);
    };
    load();
  }, [globalDate]);

  useEffect(() => {
    if (!autoRefresh || !globalDate) return;
    const interval = setInterval(async () => {
      await getShifts(globalDate);
      setLastRefreshedAt(new Date());
    }, 300000); // Auto-refresco cada 5 minutos

    return () => clearInterval(interval);
  }, [autoRefresh, globalDate, getShifts]);

  const fetchShiftDetails = async (shift: Shift) => {
    const dateStr = new Date(shift.shiftDate).toISOString().split('T')[0];
    const details = await getShiftDetails(dateStr, shift.shiftNo, shift.employeeName);
    return details || { fuel: [], products: [], paymentMethods: [] };
  };

  const handleViewDetail = async (shift: Shift) => {
    try {
      setSelectedShiftForDetail(shift);
      setDetailsOpen(true);
      setLoadingDetails(true);
      const details = await fetchShiftDetails(shift);
      setShiftDetails(details || { fuel: [], products: [], paymentMethods: [], tickets: [], documents: { invoicesCash: [], invoicesCredit: [], creditNotes: [], outflows: [] } });
      setLoadingDetails(false);
    } catch {
      setLoadingDetails(false);
      setDetailsOpen(false);
      toast.error('Error al cargar detalles del turno');
    }
  };

  const filteredShifts = shifts
    .filter(shift => selectedShiftNo === 'all' || shift.shiftNo === selectedShiftNo)
    .filter(shift => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      if (searchCriteria === 'user') return shift.employeeName?.toLowerCase().includes(query);
      if (searchCriteria === 'pos') return shift.posCodes?.toLowerCase().includes(query);
      if (searchCriteria === 'shift') return shift.shiftNo?.toLowerCase().includes(query);
      if (searchCriteria === 'fusion') return shift.fsShiftIds?.toLowerCase().includes(query);
      return true;
    });

  const handleFetchFusionDetails = async () => {
    if (!globalDate) return;
    setIsLoadingFusion(true);
    try {
      const allFsShiftIds = filteredShifts.filter(s => s.fsShiftIds).map(s => s.fsShiftIds).join('|');
      if (!allFsShiftIds) {
        toast.error('No hay turnos de CTRL asociados');
        setIsLoadingFusion(false);
        return;
      }
      const result = await getFusionDetails(allFsShiftIds);
      setFusionDetailsData(result?.hoses || []);
      setFusionValidationSummary(result?.validationSummary || null);
      setFusionModalOpen(true);
    } catch {
      toast.error('Error al obtener detalles de CTRL');
    } finally {
      setIsLoadingFusion(false);
    }
  };

  const handleBatchPrint = async () => {
    if (filteredShifts.length === 0) { toast.error('No hay turnos para imprimir'); return; }
    setIsBatchPrinting(true);
    const data: { shift: Shift; details: any }[] = [];
    try {
      for (const shift of filteredShifts) data.push({ shift, details: await fetchShiftDetails(shift) });
      const allFsShiftIds = filteredShifts.filter(s => s.fsShiftIds).map(s => s.fsShiftIds).join('|');
      if (allFsShiftIds) setBatchFusionData((await getFusionDetails(allFsShiftIds))?.hoses || []);
      else setBatchFusionData([]);
      setBatchPrintData(data);
      setPrintMetadata({
        printedBy: user?.name ? `${user.name} (${user.username})` : (user?.username || 'ADMINISTRACIÓN'),
        printedAt: new Date().toISOString()
      });
      setTimeout(() => { window.print(); setIsBatchPrinting(false); setBatchPrintData([]); setBatchFusionData([]); }, 1200);
    } catch {
      toast.error('Error durante la impresión masiva');
      setIsBatchPrinting(false);
    }
  };

  const handleFetchUnifiedPayments = async () => {
    if (!globalDate) return;
    setIsLoadingUnified(true);
    try {
      const ids = filteredShifts.filter(s => s.reconcilerShiftId).map(s => s.reconcilerShiftId).join('|');
      if (!ids) { toast.error('No hay turnos con ID de conciliación'); setIsLoadingUnified(false); return; }
      setUnifiedPayments((await getUnifiedPayments(ids)) || { unified: [], byShift: [] });
      setIsUnifiedPaymentsOpen(true);
    } catch { toast.error('Error al obtener pagos unificados'); }
    finally { setIsLoadingUnified(false); }
  };

  const handleFetchUnifiedProducts = async () => {
    if (!globalDate) return;
    setIsLoadingProducts(true);
    try {
      const ids = filteredShifts.filter(s => s.reconcilerShiftId).map(s => s.reconcilerShiftId).join('|');
      if (!ids) { toast.error('No hay turnos con ID de conciliación'); setIsLoadingProducts(false); return; }
      setUnifiedProducts((await getUnifiedProducts(ids)) || { unified: [], byShift: [] });
      setIsUnifiedProductsOpen(true);
    } catch { toast.error('Error al obtener venta por producto'); }
    finally { setIsLoadingProducts(false); }
  };

  const handleSyncByDate = async () => {
    if (!globalDate) { toast.error('Seleccione una fecha'); return; }
    try {
      setSyncingDate(true);
      const { selectedStore } = useAppStore.getState();
      if (!selectedStore) return;

      const shiftsFromTpv = await useShiftStore.getState().getTpvShifts(globalDate);
      if (shiftsFromTpv.length === 0) { toast.warning('No hay turnos en TPV'); setSyncingDate(false); return; }

      const boShifts = useShiftStore.getState().shifts;
      const shiftsToSync = shiftsFromTpv.filter((tpv: any) => {
        const existing = boShifts.find((b: any) =>
          b.reconcilerShiftId === tpv.reconcilerShiftId ||
          (b.shiftNo === tpv.shiftNo && b.employeeName === tpv.employeeName)
        );
        return !(existing && existing.status === 'CLOSED');
      });

      if (shiftsToSync.length === 0) { toast.info('No hay turnos nuevos para sincronizar'); setSyncingDate(false); return; }

      const waitForAutoSync = async (): Promise<boolean> => {
        let attempts = 0;
        while (attempts < 60) {
          try {
            const { data } = await api.get('/etl/cron-status');
            if (!data.running) {
              setAutoSyncStatus({ running: false, sinceDate: null });
              return true;
            }
            if (attempts === 0) {
              setSyncModalOpen(true);
              setSyncStatus('syncing');
              setSyncMessages(['Sincronización automática en curso.']);
              setSyncMessages(prev => [...prev, 'Esperando que termine para continuar...']);
            }
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
          } catch {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
          }
        }
        return false;
      };

      if (autoSyncStatus.running) {
        const canProceed = await waitForAutoSync();
        if (!canProceed) {
          setSyncMessages(prev => [...prev, '[ERR] Timeout esperando sincronización automática.']);
          setSyncStatus('error');
          toast.error('La sincronización automática sigue en curso.');
          setSyncingDate(false);
          return;
        }
      }

      setSyncModalOpen(true);
      setSyncStatus('syncing');
      const ids = shiftsToSync.map((s: any) => s.reconcilerShiftId).filter(Boolean);
      setSyncMessages([
        `Sincronizando ${ids.length} turnos de tienda ${selectedStore.code}...`,
        ...shiftsToSync.map((s: any) => `  ⏳ Turno #${s.shiftNo} — ${s.employeeName}`),
        '',
        'Procesando...',
      ]);

      const result = await syncMultipleShifts(ids);

      if (result.results) {
        const msgs: string[] = [];
        for (const r of result.results) {
          const shift = shiftsToSync.find((s: any) => s.reconcilerShiftId === r.reconcilerShiftId);
          const label = shift ? `Turno #${shift.shiftNo} — ${shift.employeeName}` : r.reconcilerShiftId;
          if (r.success) {
            msgs.push(`[OK] ${label}`);
          } else {
            msgs.push(`[ERR] ${label}: ${r.error}`);
          }
        }
        setSyncMessages(prev => [...prev, '', ...msgs]);
        setSyncStatus('completed');
        if (result.errors === 0) toast.success(`Sincronización finalizada (${result.synced} turnos)`);
        else toast.warning(`Finalizado con ${result.errors} errores`);
      } else {
        setSyncMessages(prev => [...prev, `[ERR] ${result.error || result.message || 'Error desconocido'}`]);
        setSyncStatus('error');
        toast.error('Error al sincronizar');
      }
      setTimeout(() => getShifts(globalDate), 500);
    } catch (error: any) {
      setSyncMessages(prev => [...prev, `Error crítico: ${error.message}`]);
      setSyncStatus('error');
      toast.error('Error crítico al sincronizar');
    } finally {
      setSyncingDate(false);
    }
  };

  const handlePdfExport = async (shift: Shift, details: any) => {
    const { selectedStore, user } = useAppStore.getState();
    const pdfContainerId = 'pdf-export-container';
    let container = document.getElementById(pdfContainerId);
    if (!container) {
      container = document.createElement('div');
      container.id = pdfContainerId;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      document.body.appendChild(container);
    }
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);
    root.render(
      <PrintShiftReport
        shift={shift}
        details={details}
        metadata={printMetadata}
        store={selectedStore}
        user={user}
      />
    );
    await new Promise(r => setTimeout(r, 500));
    try {
      await exportElementToPdf(container, `Turno_${shift.shiftNo}_${shift.employeeName?.replace(/\s+/g, '_')}.pdf`);
    } finally {
      root.unmount();
    }
  };

  const executePrint = async (shift: Shift, details: any) => {
    try {
      const { selectedStore, user } = useAppStore.getState();
      if (!selectedStore) { toast.error('Tienda no seleccionada'); return; }
      const result = await printShiftReport({
        shiftDate: shift.shiftDate, shiftNo: shift.shiftNo,
        employeeName: shift.employeeName, printedBy: user?.username || 'Usuario',
        details: { ...details, stationName: selectedStore.name, turnoControlador: shift.fsShiftIds, id_contadores: null }
      });
      if (result.success) { setPrintMetadata(result); setTimeout(() => window.print(), 500); }
    } catch { toast.error('Error al registrar la impresión'); }
  };

  const handleQuickPrint = async (shift: Shift) => {
    try {
      const details = await fetchShiftDetails(shift);
      await executePrint(shift, details);
    } catch { toast.error('Error al preparar impresión'); }
  };

  const reconciliation = useMemo(() => calculateReconciliation({
    fuel: shiftDetails.fuel || [],
    products: shiftDetails.products || [],
    creditNotes: shiftDetails.documents?.creditNotes || [],
    outflows: shiftDetails.documents?.outflows || [],
    presentationDetails: selectedShiftForDetail?.presentationDetails,
    totalTaxes: shiftDetails.totalTaxes,
  }), [shiftDetails, selectedShiftForDetail]);

  const handlePresentPayments = (shift: Shift) => {
    setSelectedPresentationShift(shift);
    setPresentationModalOpen(true);
  };

  if (shiftsLoading && shifts.length === 0) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full space-y-3 print:hidden">
        <Card className="flex flex-col h-full min-h-[400px] overflow-hidden shadow-xl shadow-foreground/5 border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-4 py-1.5 bg-muted/30 border-b border-border/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-foreground">Sincronización automática</span>
            {autoSyncStatus.running && autoSyncStatus.sinceDate && (
              <>
                <span className="mx-1">•</span>
                <span className="text-emerald-400">sincronizando desde {autoSyncStatus.sinceDate}</span>
              </>
            )}
            <span className="mx-1">•</span>
            <span>Última actualización de vista: <strong className="text-foreground">{lastRefreshedAt.toLocaleTimeString('es-HN')}</strong></span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="ml-auto text-[11px] font-medium text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {autoRefresh ? 'Pausar auto-refresco UI' : 'Activar auto-refresco UI (5 min)'}
            </button>
          </div>
          <CardHeader className="py-3 px-4 shrink-0 border-b border-border/40">
            <ReconciliationToolbar
              shifts={shifts} filteredCount={filteredShifts.length}
              isLoadingUnified={isLoadingUnified} isLoadingProducts={isLoadingProducts}
              isLoadingFusion={isLoadingFusion} isBatchPrinting={isBatchPrinting}
              syncingDate={syncingDate} autoSyncRunning={autoSyncStatus.running}
              searchCriteria={searchCriteria}
              searchQuery={searchQuery} selectedShiftNo={selectedShiftNo}
              onFetchUnifiedPayments={handleFetchUnifiedPayments}
              onFetchUnifiedProducts={handleFetchUnifiedProducts}
              onSyncByDate={handleSyncByDate}
              onFetchFusionDetails={handleFetchFusionDetails}
              onBatchPrint={handleBatchPrint}
              onOpenFiscalAudit={() => setFiscalAuditOpen(true)}
              onSearchCriteriaChange={(v: string) => setSearchCriteria(v as any)}
              onSearchQueryChange={setSearchQuery}
              onSelectedShiftNoChange={setSelectedShiftNo}
            />
          </CardHeader>
          <CardContent className="p-0 flex-1 relative flex flex-col overflow-hidden min-h-0">
            {filteredShifts.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/30 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {filteredShifts.length} turno{filteredShifts.length !== 1 ? 's' : ''} mostrado{filteredShifts.length !== 1 ? 's' : ''}
                </span>
                <span className="text-base font-black text-primary font-mono tracking-tight">
                  Venta Total: {formatCurrency(filteredShifts.reduce((sum, s) => sum + Number(s.totalSale || 0), 0))}
                </span>
              </div>
            )}
            <div className="relative w-full flex-1 overflow-auto min-h-0">
              <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
                <TableHeader className="sticky top-0 z-30 bg-muted/60 backdrop-blur-md shadow-sm border-b">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Fecha</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Turno</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Usuario</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">POS</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-primary ml-1">CTRL</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Inicio</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Fin</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-right text-muted-foreground">Venta Total</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Estado</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-left pl-2 text-muted-foreground">Presentación</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Auditoría</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-right text-muted-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.map((shift) => (
                    <TableRow key={shift.id} className="hover:bg-muted/20 transition-colors border-b border-border/20">
                      <TableCell className="text-xs">{formatShiftDate(shift.shiftDate)}</TableCell>
                      <TableCell className="font-medium text-xs">#{shift.shiftNo}</TableCell>
                      <TableCell className="text-xs">{shift.employeeName}</TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">{shift.posCodes}</TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">{shift.fsShiftIds}</TableCell>
                      <TableCell className="text-xs">{formatTimeLiteral(shift.startTime)}</TableCell>
                      <TableCell className="text-xs">{formatTimeLiteral(shift.endTime)}</TableCell>
                      <TableCell className="text-right text-xs font-mono">L.{Number(shift.totalSale || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        {shift.auditStatus === 'SYNC_IN_PROGRESS' ? (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/10 flex items-center gap-1 animate-pulse">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Sincronizando
                            {(() => {
                              try {
                                if (shift.presentationDetails) {
                                  const d = JSON.parse(shift.presentationDetails);
                                  if (d.expectedCount) return ` (${d.actualCount || 0}/${d.expectedCount})`;
                                }
                              } catch {}
                              return '';
                            })()}
                          </Badge>
                        ) : (shift.status === 'OPEN' || shift.auditStatus === 'OPEN_OPERATIONAL') ? (
                          <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            En Curso
                          </Badge>
                        ) : (
                          <Badge variant={shift.status === 'CLOSED' ? 'default' : 'secondary'} className="text-[10px]">
                            {shift.status === 'CLOSED' ? 'Cerrado' : 'Abierto'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="inline-flex items-center gap-1">
                          {shift.auditStatus === 'SYNC_IN_PROGRESS' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 whitespace-nowrap" title="Esperando que finalice la recepción de todas las ventas del turno">
                              <RefreshCw className="h-3 w-3 shrink-0 animate-spin" />
                              En Tránsito
                            </span>
                          ) : (shift.status === 'OPEN' || shift.auditStatus === 'OPEN_OPERATIONAL') && !shift.isPresented ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/40 whitespace-nowrap">
                              Turno Abierto
                            </span>
                          ) : (shift.isPresented || shift.auditStatus === 'BALANCED' || shift.auditStatus === 'DISCREPANCY') ? (
                            <>
                              {shift.isPresented && (() => {
                                const presentationMins = selectedStore?.PresentationMinutes;
                                const isExpired = presentationMins && presentationMins > 0 && shift.presentationDate
                                  ? (Date.now() - new Date(shift.presentationDate).getTime()) / 60000 >= presentationMins
                                  : false;
                                return isExpired ? (
                                  <span className="inline-flex items-center justify-center h-7 w-7 text-muted-foreground/50" title="Tiempo de edición expirado">
                                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                                  </span>
                                ) : (
                                  <Button variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); handlePresentPayments(shift); }}
                                    aria-label="Editar presentación" title="Editar presentación"
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                  </Button>
                                );
                              })()}
                              {(shift.isBalanced || shift.auditStatus === 'BALANCED') ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 whitespace-nowrap">
                                  <Check className="h-3 w-3 shrink-0" />
                                  Cuadrado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                  Descuadre {shift.cashVariance != null ? `(L.${Number(shift.cashVariance).toFixed(2)})` : ''}
                                </span>
                              )}
                            </>
                          ) : (
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2"
                              onClick={(e) => { e.stopPropagation(); handlePresentPayments(shift); }}
                            >
                              Presentar
                            </Button>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {shift.auditStatus === 'AUDITED' ? (
                            <Badge
                              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] flex items-center gap-1 cursor-pointer hover:bg-emerald-500/20"
                              onClick={() => { setSelectedAuditShift(shift); setAuditModalOpen(true); }}
                            >
                              <ShieldCheck className="w-3 h-3" /> Auditado
                            </Badge>
                          ) : shift.auditStatus === 'IN_REVIEW' ? (
                            <Badge
                              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] flex items-center gap-1 cursor-pointer hover:bg-amber-500/20"
                              onClick={() => { setSelectedAuditShift(shift); setAuditModalOpen(true); }}
                            >
                              En Revisión
                            </Badge>
                          ) : shift.auditStatus === 'SYNC_IN_PROGRESS' ? (
                            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/10">
                              En Tránsito
                            </Badge>
                          ) : shift.auditStatus === 'BALANCED' ? (
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Auto-Cuadrado
                            </Badge>
                          ) : shift.auditStatus === 'DISCREPANCY' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 gap-1 bg-red-500/5"
                              onClick={() => { setSelectedAuditShift(shift); setAuditModalOpen(true); }}
                            >
                              <AlertCircle className="w-3 h-3" /> Revisar Descuadre
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-primary gap-1"
                              onClick={() => { setSelectedAuditShift(shift); setAuditModalOpen(true); }}
                            >
                              <ShieldCheck className="w-3 h-3" /> Auditar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                            <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewDetail(shift)} title="Ver detalle" aria-label="Ver detalle">
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleQuickPrint(shift)} title="Imprimir" aria-label="Imprimir">
                            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ShiftDetailDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        selectedShift={selectedShiftForDetail}
        shiftDetails={shiftDetails}
        loadingDetails={loadingDetails}
        reconciliation={reconciliation}
        isMaximized={isMaximized}
        onToggleMaximize={() => setIsMaximized(!isMaximized)}
        onPrint={executePrint}
        onPdfExport={handlePdfExport}
      />

      {/* Modals */}
      <PresentationModal
        open={presentationModalOpen} onOpenChange={setPresentationModalOpen}
        shift={selectedPresentationShift}
        onSuccess={() => { getShifts(globalDate); }}
      />

      <AuditShiftModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        shift={selectedAuditShift}
        onAuditSuccess={() => { if (globalDate) getShifts(globalDate); }}
      />

      <FusionDetailsModal
        open={fusionModalOpen} onOpenChange={setFusionModalOpen}
        fusionDetails={fusionDetails} validationSummary={fusionValidationSummary}
      />

      <SyncModal
        open={syncModalOpen} onOpenChange={setSyncModalOpen}
        messages={syncMessages} status={syncStatus}
      />

      <UnifiedPaymentsModal
        open={isUnifiedPaymentsOpen} onOpenChange={setIsUnifiedPaymentsOpen}
        unifiedPayments={unifiedPayments}
      />

      <UnifiedProductsModal
        open={isUnifiedProductsOpen} onOpenChange={setIsUnifiedProductsOpen}
        unifiedProducts={unifiedProducts}
      />

      <FiscalAuditModal
        open={fiscalAuditOpen}
        onOpenChange={setFiscalAuditOpen}
        storeCode={selectedStore?.code}
      />

      {/* Print Components (hidden) */}
      <div className="hidden print:block">
        {selectedShiftForDetail && (
          <PrintShiftReport
            shift={selectedShiftForDetail} details={shiftDetails}
            metadata={printMetadata} store={selectedStore}
            user={user}
          />
        )}
        {batchPrintData.length > 0 && (
          <PrintBatchShiftsReport
            batchData={batchPrintData} fusionData={batchFusionData}
            filteredShifts={filteredShifts}
            metadata={printMetadata} store={selectedStore}
            user={user}
          />
        )}
      </div>
    </>
  );
};
