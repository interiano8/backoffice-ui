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
import { Label } from '@radix-ui/react-label';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import api from '../infrastructure/api/api-client';

interface AuditShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any;
  onAuditSuccess: () => void;
}

export const AuditShiftModal: React.FC<AuditShiftModalProps> = ({
  open,
  onOpenChange,
  shift,
  onAuditSuccess,
}) => {
  const [auditStatus, setAuditStatus] = useState<string>('AUDITED');
  const [notes, setNotes] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shift) {
      setAuditStatus(shift.auditStatus || 'AUDITED');
      setNotes(shift.auditNotes || '');
      setIsLocked(shift.isLocked ?? true);
    }
  }, [shift, open]);

  if (!shift) return null;

  const handleSaveAudit = async () => {
    setSaving(true);
    try {
      const shiftId = shift.id || shift.reconcilerShiftId;
      const res = await api.patch(`/shifts/${shiftId}/audit`, {
        auditStatus,
        auditNotes: notes,
        isLocked,
        cashVariance: shift.cashVariance || 0,
        fuelVariance: shift.fuelVariance || 0,
      });

      if (res.data?.success) {
        toast.success(`Turno #${shift.shiftNo} auditado con éxito`);
        onAuditSuccess();
        onOpenChange(false);
      } else {
        toast.error('Error al guardar auditoría: ' + (res.data?.error || 'Falló la operación'));
      }
    } catch (err: any) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <DialogTitle className="text-xl font-bold">
              Auditoría y Cierre de Turno #{shift.shiftNo}
            </DialogTitle>
          </div>
          <DialogDescription>
            {shift.employeeName} • {new Date(shift.shiftDate).toLocaleDateString('es-HN')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Summary Box */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border/40 text-xs">
            <div>
              <span className="text-muted-foreground block">Venta Total:</span>
              <span className="font-mono font-bold text-sm text-foreground">
                {formatCurrency(shift.totalSale || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Estado Actual:</span>
              <Badge variant={shift.status === 'CLOSED' ? 'default' : 'secondary'} className="text-[10px] mt-0.5">
                {shift.status === 'CLOSED' ? 'Cerrado' : 'Abierto'}
              </Badge>
            </div>
          </div>

          {/* Variances Check */}
          <div className="p-3 bg-card rounded-xl border border-border/60 space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Conciliación de Descuadres</span>
              {shift.cashVariance === 0 ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" /> Cuadrado
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Verificado
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground block text-[10px]">Diferencia Efectivo:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(shift.cashVariance || 0)}
                </span>
              </div>
              <div className="p-2 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground block text-[10px]">Diferencia Combustible:</span>
                <span className="font-bold text-foreground">
                  {shift.fuelVariance ? `${shift.fuelVariance.toFixed(2)} Gal` : '0.00 Gal'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Status Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Estado de Auditoría</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'AUDITED', label: 'Auditado', icon: ShieldCheck, color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' },
                { key: 'IN_REVIEW', label: 'En Revisión', icon: Clock, color: 'border-amber-500/50 bg-amber-500/10 text-amber-500' },
                { key: 'PENDING', label: 'Pendiente', icon: AlertTriangle, color: 'border-muted bg-muted/20 text-muted-foreground' },
              ].map((st) => {
                const Icon = st.icon;
                const isSelected = auditStatus === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setAuditStatus(st.key)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected ? `${st.color} ring-2 ring-primary/40` : 'border-border/40 hover:bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="auditNotes" className="text-xs font-medium">Notas y Observaciones de Auditoría</Label>
            <Textarea
              id="auditNotes"
              placeholder="Ej. Revisado contra tirilla física y depósito bancario. Todo conforme..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20 text-xs resize-none"
            />
          </div>

          {/* Lock Switch */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/40">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <div>
                <div className="text-xs font-bold">Bloquear Turno</div>
                <div className="text-[11px] text-muted-foreground">Evitar modificaciones posteriores en la declaración</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveAudit} disabled={saving} className="gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Confirmar Auditoría'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuditShiftModal;
