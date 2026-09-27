import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"

interface UnifiedPaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unifiedPayments: { unified: any[]; byShift: any[] };
}

export function UnifiedPaymentsModal({ open, onOpenChange, unifiedPayments }: UnifiedPaymentsModalProps) {
  const { unified, byShift } = unifiedPayments;
  const totalSystem = unified.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalDeclared = unified.reduce((s: number, p: any) => s + (p.declared || 0), 0);
  const totalDiff = totalDeclared - totalSystem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Pagos Unificados
            <Badge variant="outline" className="text-xs font-mono">{byShift.length} turno(s)</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {unified.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Sistema</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalSystem)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Declarado</p>
                <p className="text-lg font-bold">{formatCurrency(totalDeclared)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Diferencia</p>
                <p className={`text-lg font-bold ${Math.abs(totalDiff) < 0.05 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalDiff >= 0 ? '+' : ''}{formatCurrency(totalDiff)}
                </p>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Resumen Unificado</h3>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Método</TableHead>
                    <TableHead className="text-right text-xs">Monto Sistema</TableHead>
                    <TableHead className="text-right text-xs">Declarado</TableHead>
                    <TableHead className="text-right text-xs">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unified.map((pm: any) => (
                    <TableRow key={pm.description} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm">{pm.description}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(pm.amount)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(pm.declared)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={Math.abs(pm.difference) > 0.5 ? 'destructive' : 'secondary'} className="font-mono text-[10px]">
                          {pm.difference >= 0 ? '+' : ''}{formatCurrency(pm.difference)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell className="text-xs uppercase tracking-wider">Total General</TableCell>
                    <TableCell className="text-right font-mono text-xs text-primary">{formatCurrency(totalSystem)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(totalDeclared)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <span className={Math.abs(totalDiff) < 0.05 ? 'text-green-500' : 'text-red-500'}>
                        {totalDiff >= 0 ? '+' : ''}{formatCurrency(totalDiff)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
                  {byShift.map((group: any) => {
            const grpTotalSys = (group.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
            const grpTotalDec = (group.payments || []).reduce((s: number, p: any) => s + (p.declared || 0), 0);
            const grpDiff = grpTotalDec - grpTotalSys;
            return (
            <div key={group.shiftNo}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Turno #{group.shiftNo}
                </h3>
                <span className="text-[10px] text-muted-foreground">—</span>
                <span className="text-[10px] text-muted-foreground">{group.employeeNames?.join(', ')}</span>
                {group.hasPendingPresentation && (
                  <Badge variant="outline" className="text-[9px] font-bold border-amber-500/30 text-amber-500 bg-amber-500/5">
                    Pendiente
                  </Badge>
                )}
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Método</TableHead>
                      <TableHead className="text-right text-xs">Monto</TableHead>
                      <TableHead className="text-right text-xs">Declarado</TableHead>
                      <TableHead className="text-right text-xs">Dif.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.payments?.map((pm: any) => (
                      <TableRow key={pm.description} className="hover:bg-muted/20">
                        <TableCell className="text-sm">{pm.description}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(pm.amount)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(pm.declared)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <span className={Math.abs(pm.difference) < 0.05 ? 'text-green-500' : 'text-red-500'}>
                            {pm.difference >= 0 ? '+' : ''}{formatCurrency(pm.difference)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell className="text-xs uppercase tracking-wider">Total Turno</TableCell>
                      <TableCell className="text-right font-mono text-xs text-primary">{formatCurrency(grpTotalSys)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(grpTotalDec)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <span className={Math.abs(grpDiff) < 0.05 ? 'text-green-500' : 'text-red-500'}>
                          {grpDiff >= 0 ? '+' : ''}{formatCurrency(grpDiff)}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
