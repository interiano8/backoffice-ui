import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/format"

interface UnifiedProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unifiedProducts: { unified: any[]; byShift: any[] };
}

export function UnifiedProductsModal({ open, onOpenChange, unifiedProducts }: UnifiedProductsModalProps) {
  const { unified, byShift } = unifiedProducts;
  const totalAmount = unified.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalVolumeGL = unified.reduce((s: number, p: any) => s + (p.volumeGL || 0), 0);
  const totalVolumeLT = unified.reduce((s: number, p: any) => s + (p.volumeLT || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Ventas por Producto
            <Badge variant="outline" className="text-xs font-mono">{byShift.length} turno(s)</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {unified.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Productos</p>
                <p className="text-lg font-bold text-primary">{unified.length}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Litros</p>
                <p className="text-lg font-bold text-primary">{formatNumber(totalVolumeLT, 6)} L</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Galones</p>
                <p className="text-lg font-bold text-primary">{formatNumber(totalVolumeGL, 6)} GL</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center border">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Monto Total</p>
                <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Resumen General</h3>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Producto</TableHead>
                    <TableHead className="text-right text-xs">Trans.</TableHead>
                    <TableHead className="text-right text-xs">Litros</TableHead>
                    <TableHead className="text-right text-xs">Galones</TableHead>
                    <TableHead className="text-right text-xs">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unified.map((p: any) => (
                    <TableRow key={p.name} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono text-[10px]">{p.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(p.volumeLT, 6)} L</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(p.volumeGL, 6)} GL</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell className="text-xs uppercase tracking-wider">Total General</TableCell>
                    <TableCell className="text-right font-mono text-xs">{unified.reduce((s: number, p: any) => s + (p.count || 0), 0)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatNumber(totalVolumeLT, 6)} L</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatNumber(totalVolumeGL, 6)} GL</TableCell>
                    <TableCell className="text-right font-mono text-xs text-primary">{formatCurrency(totalAmount)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
          {byShift.map((group: any) => {
            const grpAmount = (group.products || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
            const grpVolumeGL = (group.products || []).reduce((s: number, p: any) => s + (p.volumeGL || 0), 0);
            const grpVolumeLT = (group.products || []).reduce((s: number, p: any) => s + (p.volumeLT || 0), 0);
            const grpCount = (group.products || []).reduce((s: number, p: any) => s + (p.count || 0), 0);
            return (
            <div key={group.shiftNo}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Turno #{group.shiftNo}
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Producto</TableHead>
                      <TableHead className="text-right text-xs">Trans.</TableHead>
                      <TableHead className="text-right text-xs">Litros</TableHead>
                      <TableHead className="text-right text-xs">Galones</TableHead>
                      <TableHead className="text-right text-xs">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.products?.map((p: any) => (
                      <TableRow key={p.name} className="hover:bg-muted/20">
                        <TableCell className="text-sm font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-mono text-[10px]">{p.count}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatNumber(p.volumeLT, 6)} L</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatNumber(p.volumeGL, 6)} GL</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell className="text-xs uppercase tracking-wider">Total Turno</TableCell>
                      <TableCell className="text-right font-mono text-xs">{grpCount}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(grpVolumeLT, 6)} L</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(grpVolumeGL, 6)} GL</TableCell>
                      <TableCell className="text-right font-mono text-xs text-primary">{formatCurrency(grpAmount)}</TableCell>
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
