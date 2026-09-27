import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Loader2, Pencil, Check, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/infrastructure/api/api-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface Hose {
  id: string;
  pumpId: number;
  hoseId: number;
  gradeName: string;
  unitPrice: number | null;
  active: boolean;
}

export function HosePrices() {
  const { selectedStore } = useAppStore();
  const [hoses, setHoses] = useState<Hose[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchHoses = useCallback(async () => {
    if (!selectedStore?.code) return;
    setLoading(true);
    try {
      const { data } = await api.get('/hoses', {
        headers: { 'x-store-code': selectedStore.code },
      });
      setHoses(data);
    } catch {
      toast.error('Error al cargar mangueras');
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.code]);

  useEffect(() => {
    if (selectedStore) fetchHoses();
  }, [selectedStore, fetchHoses]);

  const handleEdit = (hose: Hose) => {
    setEditingId(hose.id);
    setEditValue(hose.unitPrice != null ? String(hose.unitPrice) : '');
  };

  const handleSave = async (id: string) => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      toast.error('Ingrese un precio válido');
      return;
    }
    setSavingId(id);
    try {
      await api.patch(`/hoses/${id}/price`, { unitPrice: value });
      toast.success('Precio actualizado');
      setEditingId(null);
      fetchHoses();
    } catch {
      toast.error('Error al actualizar precio');
    } finally {
      setSavingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-[400px]">
          <CardHeader><CardTitle className="text-center">Seleccione una tienda</CardTitle></CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Debe seleccionar una sucursal para ver los precios de mangueras.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between bg-background/95 backdrop-blur p-4 rounded-xl border border-border/50 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Precios de Mangueras
          </h1>
          <p className="text-muted-foreground text-sm">{selectedStore.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHoses} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm flex-1 overflow-auto">
        <CardContent className="p-0">
          {loading && hoses.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hoses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <DollarSign className="h-12 w-12 mb-4 opacity-30" />
              <p>No se encontraron mangueras para esta tienda.</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/40 border-b text-xs font-bold uppercase text-muted-foreground">
                <div className="col-span-2">Bomba</div>
                <div className="col-span-2">Manguera</div>
                <div className="col-span-4">Producto</div>
                <div className="col-span-2 text-right">Precio</div>
                <div className="col-span-2 text-center">Acción</div>
              </div>
              <div className="divide-y">
                {hoses.map((hose) => (
                  <div key={hose.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/10 transition-colors">
                    <div className="col-span-2 font-mono text-sm font-semibold">Bomba {hose.pumpId}</div>
                    <div className="col-span-2 font-mono text-sm">#{hose.hoseId}</div>
                    <div className="col-span-4 text-sm font-medium truncate">{hose.gradeName}</div>
                    <div className="col-span-2 text-right">
                      {editingId === hose.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 w-full text-right font-mono text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(hose.id);
                            if (e.key === 'Escape') handleCancel();
                          }}
                        />
                      ) : (
                        <span className="font-mono text-sm font-semibold">
                          {hose.unitPrice != null ? `L ${Number(hose.unitPrice).toFixed(2)}` : '-'}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      {editingId === hose.id ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleSave(hose.id)} disabled={savingId === hose.id} className="h-7 w-7 p-0 text-emerald-500">
                            {savingId === hose.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 w-7 p-0 text-red-500">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(hose)} className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
