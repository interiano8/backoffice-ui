import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Minimize2, Maximize2, Printer, FileDown, FileText } from 'lucide-react';
import type { Shift } from '../types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShiftDate, formatDateTimeLiteral, formatNumber } from "@/lib/format";
import { useNavigate } from 'react-router-dom';

interface ShiftDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedShift: Shift | null;
  shiftDetails: any;
  loadingDetails: boolean;
  reconciliation: any;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onPrint: (shift: Shift, details: any) => void;
  onPdfExport: (shift: Shift, details: any) => void;
}

export function ShiftDetailDialog({
  open,
  onOpenChange,
  selectedShift,
  shiftDetails,
  loadingDetails,
  reconciliation,
  isMaximized,
  onToggleMaximize,
  onPrint,
  onPdfExport,
}: ShiftDetailDialogProps) {
  const navigate = useNavigate();

  const creditInvoices = shiftDetails.documents?.invoicesCredit || [];
  const lealPayments = (shiftDetails.documents?.invoicesCash || []).reduce((acc: any[], inv: any) => {
    const lp = inv.payments?.filter((p: any) => p.paymentMethod?.toUpperCase().includes('LEAL')) || [];
    lp.forEach((p: any) => {
      const lealRatio = Number(inv.totalAmount) > 0 ? Number(p.amount) / Number(inv.totalAmount) : 1;
      acc.push({
        ...inv,
        lealAmount: Number(p.amount),
        lealRatio,
        totalAmount: inv.totalAmount,
      });
    });
    return acc;
  }, []);
  const creditNotes = shiftDetails.documents?.creditNotes || [];

  let presentationMap: Record<string, number> = {};
  try {
    const details = typeof selectedShift?.presentationDetails === 'string'
      ? JSON.parse(selectedShift.presentationDetails)
      : selectedShift?.presentationDetails;
    if (Array.isArray(details)) {
      details.forEach((d: any) => {
        presentationMap[d.name?.toUpperCase()] = Number(d.declared || 0);
      });
    }
  } catch (_) {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMaximized ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-6xl'} max-h-[90vh] overflow-auto`}>
        <DialogHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <DialogTitle className="text-base">
              Detalle de Turno #{selectedShift?.shiftNo} — {selectedShift?.employeeName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Información detallada del turno incluyendo ventas de combustible, formas de pago, productos y documentos.
            </DialogDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Fecha turno: {formatShiftDate(selectedShift?.shiftDate)}</span>
              {selectedShift?.startTime && <><span className="text-muted-foreground/40">|</span><span>Inicio: {formatDateTimeLiteral(selectedShift.startTime)}</span></>}
              {selectedShift?.endTime && <><span className="text-muted-foreground/40">|</span><span>Fin: {formatDateTimeLiteral(selectedShift.endTime)}</span></>}
              <Badge variant={selectedShift?.status === 'CLOSED' ? 'default' : 'secondary'} className="text-xs font-bold ml-1">
                {selectedShift?.status === 'CLOSED' ? 'Cerrado' : 'Abierto'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onToggleMaximize} className="h-7 w-7" aria-label={isMaximized ? 'Minimizar' : 'Maximizar'}>
              {isMaximized ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-7 w-7" aria-label="Cerrar">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </DialogHeader>
            {/* Document Counters */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <h3 className="text-sm font-semibold">Documentos del Turno</h3>
              </div>
              <div className="grid grid-cols-4 gap-3 p-4">
                <div className="bg-muted/20 rounded-lg p-3 text-center border border-border/30">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fact. Contado</div>
                  <div className="text-xl font-black text-primary">{shiftDetails.counters?.InvoiceCashCount || 0}</div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3 text-center border border-border/30">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fact. Crédito</div>
                  <div className="text-xl font-black text-amber-500">{shiftDetails.counters?.InvoiceCreditCount || 0}</div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3 text-center border border-border/30">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Notas Crédito</div>
                  <div className="text-xl font-black text-red-500">{shiftDetails.counters?.CreditNoteCount || 0}</div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3 text-center border border-border/30">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tickets/Salidas</div>
                  <div className="text-xl font-black text-purple-500">{shiftDetails.counters?.OutflowCount || 0}</div>
                </div>
              </div>
            </div>
        {loadingDetails ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Validation Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Total CTRL</div>
                <div className="text-lg font-bold text-primary">L.{formatNumber(reconciliation.fuelTotalCtrl, 2)}</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Venta Neta POS</div>
                <div className="text-lg font-bold text-primary">L.{formatNumber(reconciliation.totalNetSalesPos, 2)}</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Total Descuentos</div>
                <div className="text-lg font-bold text-amber-500">L.{formatNumber(reconciliation.totalDiscounts, 2)}</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Notas Crédito</div>
                <div className="text-lg font-bold text-red-500">L.{formatNumber(reconciliation.totalCreditNotes, 2)}</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Diferencia Comb.</div>
                <div className={`text-lg font-bold ${Math.abs(reconciliation.diffFuel) < 0.1 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatNumber(reconciliation.diffFuel, 2)}
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Estado</div>
                <Badge variant={reconciliation.isCuadrado ? 'default' : 'destructive'} className="text-xs">
                  {reconciliation.isCuadrado ? 'CUADRADO' : 'DESCUADRADO'}
                </Badge>
              </div>
            </div>

            {/* Totals by Product */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.entries(
                (shiftDetails.fuel || []).reduce((acc: Record<string, { volumeGL: number; volumeLT: number; amount: number }>, item: any) => {
                  const name = item.productName || "Combustible";
                  if (!acc[name]) acc[name] = { volumeGL: 0, volumeLT: 0, amount: 0 };
                  acc[name].volumeGL += item.volumeGL || 0;
                  acc[name].volumeLT += item.volumeLT || 0;
                  acc[name].amount += item.amount || 0;
                  return acc;
                }, {})
              ).map(([product, totals]: [string, any]) => (
                <div key={product} className="bg-muted/30 p-3 rounded-lg text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">{product}</div>
                  <div className="text-lg font-bold text-primary">{formatNumber(totals.volumeGL, 6)} GL</div>
                  <div className="text-xs text-muted-foreground">{formatNumber(totals.volumeLT, 6)} L</div>
                </div>
              ))}
            </div>

            {/* Fuel Sales Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b">
                <h3 className="text-sm font-semibold">Ventas de Combustible</h3>
                <Badge variant="outline" className="text-xs">{shiftDetails.fuel?.length || 0} registros</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Manguera</TableHead>
                      <TableHead className="text-xs">Producto</TableHead>
                      <TableHead className="text-xs text-right">Galones</TableHead>
                      <TableHead className="text-xs text-right">Litros</TableHead>
                      <TableHead className="text-xs text-right">Monto</TableHead>
                      <TableHead className="text-xs text-right">Descuento</TableHead>
                      <TableHead className="text-xs text-right">Precio</TableHead>
                      <TableHead className="text-xs text-right">CTRL Vol</TableHead>
                      <TableHead className="text-xs text-right">CTRL Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftDetails.fuel?.map((item: any) => (
                      <TableRow key={`${item.pumpId}-${item.hoseId}`}>
                        <TableCell className="font-mono text-xs">{item.pumpId}-{item.hoseId}</TableCell>
                        <TableCell className="text-xs">{item.productName}</TableCell>
                        <TableCell className="text-right text-xs">{formatNumber(item.volumeGL, 6)} GL</TableCell>
                        <TableCell className="text-right text-xs">{formatNumber(item.volumeLT, 6)} L</TableCell>
                        <TableCell className="text-right text-xs">L.{formatNumber(item.amount, 2)}</TableCell>
                        <TableCell className="text-right text-xs text-amber-500">L.{formatNumber(item.discount, 2)}</TableCell>
                        <TableCell className="text-right text-xs">
                          {typeof item.prices === 'string' ? (item.prices || '-') : (Array.isArray(item.prices) ? item.prices.join(', ') : '-')}
                        </TableCell>
                        <TableCell className="text-right text-xs">{formatNumber(item.fsVolume, 6)}</TableCell>
                        <TableCell className="text-right text-xs">L.{formatNumber(item.fsAmount, 2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-muted/50">
                      <TableCell colSpan={2} className="text-xs font-bold">TOTAL COMBUSTIBLE</TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        {formatNumber(shiftDetails.fuel?.reduce((acc: number, i: any) => acc + (i.volumeGL || 0), 0), 6)} GL
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        {formatNumber(shiftDetails.fuel?.reduce((acc: number, i: any) => acc + (i.volumeLT || 0), 0), 6)} L
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        L.{formatNumber(shiftDetails.fuel?.reduce((acc: number, i: any) => acc + (i.amount || 0), 0), 2)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-amber-500">
                        L.{formatNumber(shiftDetails.fuel?.reduce((acc: number, i: any) => acc + (i.discount || 0), 0), 2)}
                      </TableCell>
                      <TableCell className="text-right text-xs"></TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        {formatNumber(shiftDetails.fuel?.reduce((acc: number, i: any) => acc + (i.fsVolume || 0), 0), 6)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        L.{formatNumber(shiftDetails.fuel?.reduce((acc: number, i: any) => acc + (i.fsAmount || 0), 0), 2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Payment Methods Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b">
                <h3 className="text-sm font-semibold">Formas de Pago</h3>
                <Badge variant="outline" className="text-xs">{shiftDetails.paymentMethods?.length || 0} métodos</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Método</TableHead>
                      <TableHead className="text-xs text-right">Cobros</TableHead>
                      <TableHead className="text-xs text-right">Monto</TableHead>
                      <TableHead className="text-xs text-right">PRESENTADO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftDetails.paymentMethods?.map((pm: any) => {
                      const declared = presentationMap[pm.description?.toUpperCase()] ?? 0;
                      return (
                      <TableRow key={pm.description}>
                        <TableCell className="text-xs">{pm.description}</TableCell>
                        <TableCell className="text-right text-xs">{pm.count}</TableCell>
                        <TableCell className="text-right text-xs">L.{formatNumber(pm.amount, 2)}</TableCell>
                        <TableCell className="text-right text-xs">L.{formatNumber(declared, 2)}</TableCell>
                      </TableRow>
                    );
                    })}
                    <TableRow className="border-t-2 bg-muted/50">
                      <TableCell className="text-xs font-bold">TOTAL</TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        {shiftDetails.paymentMethods?.reduce((acc: number, pm: any) => acc + (pm.count || 0), 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        L.{formatNumber(shiftDetails.paymentMethods?.reduce((acc: number, pm: any) => acc + (pm.amount || 0), 0), 2)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold">
                        L.{formatNumber(Object.values(presentationMap).reduce((acc, v) => acc + v, 0), 2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {selectedShift?.presentationComment && (
                <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground italic">
                  Comentario: {selectedShift.presentationComment}
                </div>
              )}
            </div>

            {/* Products Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b">
                <h3 className="text-sm font-semibold">Otros Productos</h3>
                <Badge variant="outline" className="text-xs">{shiftDetails.products?.length || 0} items</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Producto</TableHead>
                      <TableHead className="text-xs text-right">Cantidad</TableHead>
                      <TableHead className="text-xs text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftDetails.products?.map((p: any) => (
                      <TableRow key={p.productName}>
                        <TableCell className="text-xs">{p.productName}</TableCell>
                        <TableCell className="text-right text-xs">{formatNumber(p.quantity, 2)}</TableCell>
                        <TableCell className="text-right text-xs">L.{formatNumber(p.amount, 2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Credit Invoices Table */}
            {creditInvoices.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b">
                  <h3 className="text-sm font-semibold">Facturas de Crédito</h3>
                  <Badge variant="outline" className="text-xs">{creditInvoices.length} facturas</Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">No.</TableHead>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">Cta.</TableHead>
                        <TableHead className="text-xs">RTN</TableHead>
                        <TableHead className="text-xs">Producto</TableHead>
                        <TableHead className="text-xs text-right">Cant.</TableHead>
                        <TableHead className="text-xs text-right">Monto</TableHead>
                        <TableHead className="text-xs">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditInvoices.map((inv: any) => (
                        <TableRow key={inv.docNo}>
                          <TableCell className="font-mono text-xs">{inv.docNo}</TableCell>
                          <TableCell className="text-xs font-medium">{inv.customerName || 'CLIENTE FINAL'}</TableCell>
                          <TableCell className="text-xs font-mono">{inv.customerNo || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">{inv.rtn || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground italic max-w-[180px] truncate">
                            {inv.lines?.map((l: any) => l.description).join(', ') || '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap">
                            {formatNumber(inv.lines?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0), 6)} {inv.lines?.[0]?.unit || 'UN'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold">L.{formatNumber(inv.totalAmount, 2)}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                        {inv.date
                          ? new Date(inv.date).toLocaleDateString('es-HN') + ' ' +
                            new Date(inv.date).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: false })
                          : '-'}
                      </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 bg-muted/50">
                        <TableCell colSpan={6} className="text-xs font-bold">TOTAL</TableCell>
                        <TableCell className="text-right text-xs font-bold">
                          L.{formatNumber(creditInvoices.reduce((acc: number, inv: any) => acc + (Number(inv.totalAmount) || 0), 0), 2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* LEAL Payments Table */}
            {lealPayments.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b">
                  <h3 className="text-sm font-semibold">Pagos LEAL</h3>
                  <Badge variant="outline" className="text-xs">{lealPayments.length} pagos</Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">No.</TableHead>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">Cta.</TableHead>
                        <TableHead className="text-xs">RTN</TableHead>
                        <TableHead className="text-xs">Producto</TableHead>
                        <TableHead className="text-xs text-right">Cant.</TableHead>
                        <TableHead className="text-xs text-right">Monto LEAL</TableHead>
                        <TableHead className="text-xs">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lealPayments.map((inv: any, idx: number) => (
                        <TableRow key={`${inv.docNo}-${idx}`}>
                          <TableCell className="font-mono text-xs">{inv.docNo}</TableCell>
                          <TableCell className="text-xs font-medium">{inv.customerName || 'CLIENTE FINAL'}</TableCell>
                          <TableCell className="text-xs font-mono">{inv.customerNo || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">{inv.rtn || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground italic max-w-[180px] truncate">
                            {inv.lines?.map((l: any) => l.description).join(', ') || '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap">
                            {formatNumber(inv.lines?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0), 6)} {inv.lines?.[0]?.unit || 'UN'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold text-violet-500">L.{formatNumber(inv.lealAmount, 2)}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {inv.date
                              ? new Date(inv.date).toLocaleDateString('es-HN') + ' ' +
                                new Date(inv.date).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: false })
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 bg-muted/50">
                        <TableCell colSpan={6} className="text-xs font-bold">TOTAL LEAL</TableCell>
                        <TableCell className="text-right text-xs font-bold text-violet-500">
                          L.{formatNumber(lealPayments.reduce((acc: number, inv: any) => acc + (inv.lealAmount || 0), 0), 2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Credit Notes Table */}
            {creditNotes.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b">
                  <h3 className="text-sm font-semibold">Notas de Crédito</h3>
                  <Badge variant="outline" className="text-xs">{creditNotes.length} notas</Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">No. NC</TableHead>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs">Cta.</TableHead>
                        <TableHead className="text-xs">Afecta</TableHead>
                        <TableHead className="text-xs">Producto</TableHead>
                        <TableHead className="text-xs text-right">Cant.</TableHead>
                        <TableHead className="text-xs text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditNotes.map((nc: any) => (
                        <TableRow key={nc.docNo}>
                          <TableCell className="font-mono text-xs">{nc.docNo}</TableCell>
                          <TableCell className="text-xs font-medium">{nc.customerName || 'CLIENTE FINAL'}</TableCell>
                          <TableCell className="text-xs font-mono">{nc.customerNo || '-'}</TableCell>
                          <TableCell className="font-mono text-xs text-blue-500">{nc.appliedDocNo || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground italic max-w-[180px] truncate">
                            {nc.lines?.map((l: any) => l.description).join(', ') || '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap">
                            {formatNumber(nc.lines?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0), 6)} {nc.lines?.[0]?.unit || 'UN'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold text-red-500">L.{formatNumber(nc.totalAmount, 2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 bg-muted/50">
                        <TableCell colSpan={6} className="text-xs font-bold">TOTAL</TableCell>
                        <TableCell className="text-right text-xs font-bold text-red-500">
                          L.{formatNumber(creditNotes.reduce((acc: number, nc: any) => acc + (Number(nc.totalAmount) || 0), 0), 2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end border-t pt-3 print:hidden">
              <Button variant="outline" size="sm" onClick={() => {
                  if (selectedShift) {
                  const d = new Date(selectedShift.shiftDate).toISOString().split('T')[0];
                  const shiftNo = encodeURIComponent(selectedShift.shiftNo);
                  const staff = encodeURIComponent(selectedShift.employeeName || '');
                  navigate(`/documents?startDate=${d}&endDate=${d}&shiftNo=${shiftNo}&staff=${staff}`);
                }
              }}>
                <FileText className="h-4 w-4 mr-1" /> Ver Facturas
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectedShift && onPrint(selectedShift, shiftDetails)} disabled={!selectedShift}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectedShift && onPdfExport(selectedShift, shiftDetails)} disabled={!selectedShift}>
                <FileDown className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-1" /> Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
