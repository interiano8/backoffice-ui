import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface FusionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fusionDetails: any[];
  validationSummary: any;
}

export function FusionDetailsModal({ open, onOpenChange, fusionDetails, validationSummary }: FusionDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Detalles de CTRL (FusionController)</DialogTitle>
        </DialogHeader>
        {validationSummary && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/30 p-3 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Venta Neta</div>
              <div className="text-lg font-bold text-primary">L.{validationSummary.netSales?.toFixed(2)}</div>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Descuentos</div>
              <div className="text-lg font-bold text-amber-500">L.{validationSummary.discounts?.toFixed(2)}</div>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">NC</div>
              <div className="text-lg font-bold text-red-500">L.{validationSummary.creditNotes?.toFixed(2)}</div>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Total Calculado</div>
              <div className="text-lg font-bold">L.{validationSummary.calculatedTotal?.toFixed(2)}</div>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Manguera</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Vol. TPV</TableHead>
              <TableHead className="text-right">Vol. CTRL</TableHead>
              <TableHead className="text-right">Dif.</TableHead>
              <TableHead className="text-right">Monto TPV</TableHead>
              <TableHead className="text-right">Monto CTRL</TableHead>
              <TableHead className="text-right">Dif.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fusionDetails.map((hose: any) => (
              <TableRow key={hose.displayHose}>
                <TableCell className="font-mono text-xs">{hose.displayHose}</TableCell>
                <TableCell>{hose.productName}</TableCell>
                <TableCell className="text-right">{hose.tpvVolume?.toFixed(2)}</TableCell>
                <TableCell className="text-right">{hose.fusionVolume?.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={Math.abs(hose.diffVolume) > 0.5 ? 'destructive' : 'secondary'} className="text-xs">
                    {hose.diffVolume?.toFixed(2)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">L.{hose.tpvAmount?.toFixed(2)}</TableCell>
                <TableCell className="text-right">L.{hose.fusionAmount?.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={Math.abs(hose.diffAmount) > 0.5 ? 'destructive' : 'secondary'} className="text-xs">
                    L.{hose.diffAmount?.toFixed(2)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
