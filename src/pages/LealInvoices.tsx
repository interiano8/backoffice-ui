import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getLealDocuments, type LealFilters } from '@/services/doc.service';
import type { DocumentHeader, PaginatedResponse } from '@/types/api';
import { useAppStore } from '@/store/useAppStore';
import { formatShiftDate, formatNumber } from '@/lib/format';
import { Search, FileDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LEAL_TYPE_MAP: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  0: { label: 'Acumulación', variant: 'default' },
  1: { label: 'Redención', variant: 'destructive' },
  2: { label: 'Reversión', variant: 'outline' },
};

const PAGE_SIZE = 50;
const EXPORT_PAGE_SIZE = 500;
const EXPORT_CONCURRENCY = 4;

function getLealPaymentAmount(doc: DocumentHeader): number {
  return (doc.payments || [])
    .filter((p: any) => {
      const method = (p.paymentMethod || '').toUpperCase();
      const desc = (p.description || '').toUpperCase();
      return method.includes('LEAL') || desc.includes('LEAL');
    })
    .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
}

export function LealInvoices() {
  const { globalDate } = useAppStore();

  const [startShiftDate, setStartShiftDate] = useState(globalDate);
  const [endShiftDate, setEndShiftDate] = useState(globalDate);
  const [lealType, setLealType] = useState<string>('all');
  const [data, setData] = useState<DocumentHeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportTotal, setExportTotal] = useState(0);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [loadingExportTotal, setLoadingExportTotal] = useState(false);

  const buildLealFilters = (pageNum?: number, limitNum?: number): LealFilters => {
    const f: LealFilters = {
      startShiftDate,
      endShiftDate,
      page: pageNum ?? 1,
      limit: limitNum ?? PAGE_SIZE,
    };
    if (lealType && lealType !== '' && lealType !== 'all') {
      f.lealType = lealType;
    }
    return f;
  };

  const buildExportFilters = (pageNum: number): LealFilters => {
    const f: LealFilters = {
      startShiftDate,
      endShiftDate,
      page: pageNum,
      limit: EXPORT_PAGE_SIZE,
    };
    if (lealType && lealType !== '' && lealType !== 'all') {
      f.lealType = lealType;
    }
    return f;
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchData = useCallback(async (pageNum: number) => {
    if (!startShiftDate || !endShiftDate) {
      toast.error('Seleccione las fechas de turno');
      return;
    }
    setLoading(true);
    try {
      const result: PaginatedResponse<DocumentHeader> = await getLealDocuments(buildLealFilters(pageNum));
      setData(result.data || []);
      setTotal(result.total || 0);
      if ((result.data || []).length === 0) {
        toast.info('No se encontraron facturas Leal en el rango seleccionado');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al cargar facturas Leal');
    } finally {
      setLoading(false);
    }
  }, [startShiftDate, endShiftDate, lealType]);

  const handleSearch = () => {
    setSearched(true);
    setPage(1);
    fetchData(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage);
  };

  const handleOpenExport = async () => {
    if (!startShiftDate || !endShiftDate) {
      toast.error('Seleccione las fechas de turno');
      return;
    }
    setLoadingExportTotal(true);
    try {
      const result = await getLealDocuments(buildLealFilters(1, 1));
      const totalRecords = result.total || 0;
      if (totalRecords === 0) {
        toast.info('No hay facturas Leal para exportar en el rango seleccionado');
        return;
      }
      setExportTotal(totalRecords);
      setShowExportDialog(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al consultar facturas Leal');
    } finally {
      setLoadingExportTotal(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const totalPagesToFetch = Math.ceil(exportTotal / EXPORT_PAGE_SIZE);
    setExportProgress({ current: 0, total: totalPagesToFetch });
    try {
      const allDocs: DocumentHeader[] = [];
      let completed = 0;
      for (let batch = 1; batch <= totalPagesToFetch; batch += EXPORT_CONCURRENCY) {
        const batchPages: number[] = [];
        for (let p = batch; p < batch + EXPORT_CONCURRENCY && p <= totalPagesToFetch; p++) {
          batchPages.push(p);
        }
        const results = await Promise.all(
          batchPages.map((p) => getLealDocuments(buildExportFilters(p)))
        );
        for (const r of results) {
          allDocs.push(...(r.data || []));
        }
        completed += batchPages.length;
        setExportProgress({ current: completed, total: totalPagesToFetch });
      }
      const now = new Date();
      const nowStr = now.toLocaleString('es-HN', { hour12: false });
      const ts = now.toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
      const tipoLabel = lealType === 'all' ? 'Todos' : lealType === '0' ? 'Acumulación' : lealType === '1' ? 'Redención' : lealType === '2' ? 'Reversión' : 'Todos';
      const metaRows = [
        `"Fecha de generación","${nowStr}"`,
        `"Inicio Fecha Turno","${startShiftDate}"`,
        `"Fin Fecha Turno","${endShiftDate}"`,
        `"Tipo Leal","${tipoLabel}"`,
        `"Total facturas","${exportTotal}"`,
        '',
      ];
      const header = 'No.,Fecha,Fecha Turno,Turno,No. Factura,Cliente,Tipo,Puntos acumulados,Puntos redimidos,Monto redimido';
      const rows = allDocs.map((doc) => {
        const lealTypeLabel = LEAL_TYPE_MAP[doc.leal?.type ?? 0]?.label ?? 'Desconocido';
        const lealAmount = getLealPaymentAmount(doc);
        const docDate = doc.date
          ? new Date(doc.date).toLocaleDateString('es-HN') + ' ' +
            new Date(doc.date).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: false })
          : '-';
        return [
          doc.docNo,
          docDate,
          formatShiftDate(doc.shiftDate),
          doc.shiftNo ?? '-',
          doc.docNo,
          `"${(doc.customerName || 'CLIENTE FINAL').replace(/"/g, '""')}"`,
          lealTypeLabel,
          doc.leal?.type === 0 ? (doc.leal?.points ?? 0) : 0,
          doc.leal?.type === 1 ? (doc.leal?.points ?? 0) : 0,
          lealAmount,
        ].join(',');
      });
      const csv = [...metaRows, header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturas-leal-${ts}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
      toast.success(`Exportadas ${allDocs.length} facturas`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al exportar facturas Leal');
    } finally {
      setExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Facturas Leal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Filtrar facturas con acumulación y redención de Leal por rango de fecha de turno
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Inicio Fecha Turno</Label>
              <Input
                type="date"
                value={startShiftDate}
                onChange={(e) => setStartShiftDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fin Fecha Turno</Label>
              <Input
                type="date"
                value={endShiftDate}
                onChange={(e) => setEndShiftDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo Leal</Label>
              <Select value={lealType} onValueChange={setLealType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">Acumulación</SelectItem>
                  <SelectItem value="1">Redención</SelectItem>
                  <SelectItem value="2">Reversión</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading} size="sm">
                <Search className="h-4 w-4 mr-1" />
                Buscar
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExport} disabled={exporting || loadingExportTotal}>
                {loadingExportTotal ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : searched ? (
            <div className="overflow-x-auto">
              <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">No.</TableHead>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Fecha Turno</TableHead>
                    <TableHead className="text-xs">Turno</TableHead>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs text-right">Puntos acumulados</TableHead>
                    <TableHead className="text-xs text-right">Puntos redimidos</TableHead>
                    <TableHead className="text-xs text-right">Monto redimido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No se encontraron facturas Leal en el rango seleccionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((doc, idx) => {
                      const lealInfo = LEAL_TYPE_MAP[doc.leal?.type ?? 0];
                      const lealAmount = getLealPaymentAmount(doc);
                      return (
                        <TableRow key={doc.transactionId || idx}>
                          <TableCell className="font-mono text-xs">{doc.docNo}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {doc.date
                              ? new Date(doc.date).toLocaleDateString('es-HN') + ' ' +
                                new Date(doc.date).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: false })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatShiftDate(doc.shiftDate)}</TableCell>
                          <TableCell className="text-xs font-mono">{doc.shiftNo ?? '-'}</TableCell>
                          <TableCell className="text-xs font-medium">
                            {doc.leal?.name || doc.customerName || 'CLIENTE FINAL'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={lealInfo?.variant ?? 'outline'} className="text-[10px]">
                              {lealInfo?.label ?? 'Desconocido'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {doc.leal?.type === 0 ? formatNumber(doc.leal?.points ?? 0, 0) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {doc.leal?.type === 1 ? formatNumber(doc.leal?.points ?? 0, 0) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold text-violet-500">
                            L.{formatNumber(lealAmount, 2)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>
              {data.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
                  <span className="text-xs text-muted-foreground">
                    Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} facturas
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1 || loading}
                      className="h-7 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs px-2 min-w-[60px] text-center">
                      Pág. {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages || loading}
                      className="h-7 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Seleccione un rango de fechas de turno y presione Buscar
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showExportDialog} onOpenChange={(open) => { if (!exporting) setShowExportDialog(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar facturas Leal</DialogTitle>
            <DialogDescription>
              {exporting
                ? `Descargando... página ${exportProgress.current} de ${exportProgress.total}`
                : `Se exportarán los ${exportTotal} registros que coinciden con los filtros aplicados. Este proceso puede tardar varios minutos dependiendo de la cantidad de datos.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)} disabled={exporting}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Descargando...</>
              ) : (
                <><FileDown className="h-4 w-4 mr-1" /> Descargar CSV</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
