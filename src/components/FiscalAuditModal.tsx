import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  FileText,
  AlertTriangle,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../infrastructure/api/api-client';

interface FiscalGap {
  storeCode: string;
  prefix: string;
  missingFrom: string;
  missingTo: string;
  missingCount: number;
  missingDocNos: string[];
}

interface FiscalAuditReport {
  storeCode?: string;
  totalInvoicesScanned: number;
  totalGapsDetected: number;
  totalMissingInvoices: number;
  hasGaps: boolean;
  gaps: FiscalGap[];
  checkedAt: string;
}

interface FiscalAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeCode?: string;
}

export const FiscalAuditModal: React.FC<FiscalAuditModalProps> = ({
  open,
  onOpenChange,
  storeCode,
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<FiscalAuditReport | null>(null);

  const fetchFiscalGaps = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reconciliation/fiscal-gaps', {
        params: storeCode ? { storeCode } : undefined,
      });
      setReport(data);
    } catch (err: any) {
      toast.error('Error al consultar auditoría fiscal SAR: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFiscalGaps();
    }
  }, [open, storeCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Auditoría de Correlativos SAR (Detección de Huecos)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Monitoreo de secuencias consecutivas de facturación fiscal por tienda y punto de emisión
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFiscalGaps}
              disabled={loading}
              className="gap-1.5 h-8 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-500/10 text-blue-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Facturas Auditadas
                  </div>
                  <div className="text-xl font-mono font-black">
                    {report?.totalInvoicesScanned ?? 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className={`p-2 rounded-md ${report?.hasGaps ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Saltos Detectados
                  </div>
                  <div className={`text-xl font-mono font-black ${report?.hasGaps ? 'text-red-500' : 'text-emerald-500'}`}>
                    {report?.totalGapsDetected ?? 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-500/10 text-amber-500">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Facturas Omitidas
                  </div>
                  <div className="text-xl font-mono font-black text-amber-500">
                    {report?.totalMissingInvoices ?? 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className={`p-2 rounded-md ${report?.hasGaps ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {report?.hasGaps ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Estado Fiscal
                  </div>
                  <div>
                    {report?.hasGaps ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Discrepancia SAR
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                        Secuencia Íntegra
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listado de huecos o confirmación */}
          {report?.hasGaps ? (
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Atención: Se identificaron saltos de correlativos en los lotes sincronizados
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Filtro: {storeCode ? `Tienda ${storeCode}` : 'Todas las tiendas'}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Tienda</TableHead>
                    <TableHead className="text-xs">Prefijo SAR</TableHead>
                    <TableHead className="text-xs">Rango Faltante</TableHead>
                    <TableHead className="text-xs text-center">Cantidad</TableHead>
                    <TableHead className="text-xs">Números Omitidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.gaps.map((gap, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-xs font-mono">
                        {gap.storeCode}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary font-bold">
                        {gap.prefix}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {gap.missingFrom === gap.missingTo ? (
                          <span className="text-red-500 font-bold">{gap.missingFrom}</span>
                        ) : (
                          <span>
                            {gap.missingFrom} <span className="text-muted-foreground">al</span> {gap.missingTo}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold text-red-500">
                        {gap.missingCount}
                      </TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground max-w-[280px] truncate" title={gap.missingDocNos.join(', ')}>
                        {gap.missingDocNos.slice(0, 3).join(', ')}
                        {gap.missingDocNos.length > 3 ? ` ... (+${gap.missingDocNos.length - 3})` : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 border border-emerald-500/20 rounded-xl bg-emerald-500/5 text-center flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Conformidad Fiscal SAR Garantizada
              </h4>
              <p className="text-xs text-muted-foreground max-w-md">
                No se detectaron saltos numéricos en los documentos fiscales sincronizados. Todas las facturas emitidas son estrictamente contiguas.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t flex justify-between items-center sm:justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            Última verificación: {report?.checkedAt ? new Date(report.checkedAt).toLocaleString('es-HN') : 'N/A'}
          </span>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
