import { useState, useEffect, useCallback } from 'react';
import { Loader2, Pencil, Check, X, Plus, Trash2, Fuel, RefreshCw, XCircle, Edit2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/infrastructure/api/api-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface Hose {
  id: string;
  pumpId: number;
  hoseId: number;
  gradeName: string;
  fuelGradeName?: string;
  productName?: string;
  unitPrice: number | null;
  tankId?: string | null;
  active: boolean;
}

export function HosePrices() {
  const { selectedStore } = useAppStore();
  const [hoses, setHoses] = useState<Hose[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Hose modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHose, setEditingHose] = useState<Hose | null>(null);
  const [savingHose, setSavingHose] = useState(false);
  const [hoseForm, setHoseForm] = useState({
    pumpId: 1,
    hoseId: 1,
    gradeName: 'GASOLINA SUPERIOR',
    tankId: '1',
    unitPrice: '',
    active: true,
  });

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [hoseToDelete, setHoseToDelete] = useState<Hose | null>(null);
  const [deletingHose, setDeletingHose] = useState(false);

  const fetchHoses = useCallback(async () => {
    if (!selectedStore?.code) return;
    setLoading(true);
    try {
      const { data } = await api.get('/hoses', {
        headers: { 'x-store-code': selectedStore.code },
      });
      setHoses(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar mangueras');
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.code]);

  useEffect(() => {
    if (selectedStore) fetchHoses();
  }, [selectedStore, fetchHoses]);

  const handleEditInlinePrice = (hose: Hose) => {
    setEditingId(hose.id);
    setEditValue(hose.unitPrice != null ? String(hose.unitPrice) : '');
  };

  const handleSaveInlinePrice = async (id: string) => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      toast.error('Ingrese un precio válido');
      return;
    }
    setSavingId(id);
    try {
      await api.patch(`/hoses/${id}/price`, { unitPrice: value }, {
        headers: { 'x-store-code': selectedStore?.code },
      });
      toast.success('Precio actualizado');
      setEditingId(null);
      fetchHoses();
    } catch {
      toast.error('Error al actualizar precio');
    } finally {
      setSavingId(null);
    }
  };

  const handleCancelInlinePrice = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleOpenAddHose = () => {
    let nextPump = 1;
    let nextHose = 1;
    if (hoses.length > 0) {
      const maxPump = Math.max(...hoses.map((h) => Number(h.pumpId || 1)));
      const hosesInMaxPump = hoses.filter((h) => Number(h.pumpId) === maxPump);
      const maxHoseInPump = Math.max(...hosesInMaxPump.map((h) => Number(h.hoseId || 1)));
      if (maxHoseInPump >= 4) {
        nextPump = maxPump + 1;
        nextHose = 1;
      } else {
        nextPump = maxPump;
        nextHose = maxHoseInPump + 1;
      }
    }
    setEditingHose(null);
    setHoseForm({
      pumpId: nextPump,
      hoseId: nextHose,
      gradeName: 'GASOLINA SUPERIOR',
      tankId: String(nextHose),
      unitPrice: '',
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditHose = (hose: Hose) => {
    setEditingHose(hose);
    setHoseForm({
      pumpId: hose.pumpId,
      hoseId: hose.hoseId,
      gradeName: hose.gradeName || hose.fuelGradeName || hose.productName || 'GASOLINA SUPERIOR',
      tankId: hose.tankId ? String(hose.tankId) : '',
      unitPrice: hose.unitPrice != null ? String(hose.unitPrice) : '',
      active: hose.active ?? true,
    });
    setModalOpen(true);
  };

  const handleSaveHoseForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore?.code) {
      toast.error('Debe seleccionar una tienda');
      return;
    }
    const pumpId = parseInt(String(hoseForm.pumpId), 10);
    const hoseId = parseInt(String(hoseForm.hoseId), 10);
    if (isNaN(pumpId) || pumpId <= 0) {
      toast.error('El número de bomba debe ser mayor a 0');
      return;
    }
    if (isNaN(hoseId) || hoseId <= 0) {
      toast.error('El número de manguera debe ser mayor a 0');
      return;
    }
    if (!hoseForm.gradeName || !hoseForm.gradeName.trim()) {
      toast.error('El producto / combustible es obligatorio');
      return;
    }

    setSavingHose(true);
    try {
      const payload: any = {
        storeCode: selectedStore.code,
        pumpId,
        hoseId,
        gradeName: hoseForm.gradeName.trim(),
        tankId: hoseForm.tankId ? String(hoseForm.tankId).trim() : null,
        active: Boolean(hoseForm.active),
      };
      if (hoseForm.unitPrice !== '') {
        const price = parseFloat(String(hoseForm.unitPrice));
        if (!isNaN(price) && price >= 0) {
          payload.unitPrice = price;
        }
      }

      if (editingHose?.id) {
        await api.patch(`/hoses/${editingHose.id}`, payload, {
          headers: { 'x-store-code': selectedStore.code },
        });
        toast.success('Manguera actualizada exitosamente');
      } else {
        await api.post('/hoses', payload, {
          headers: { 'x-store-code': selectedStore.code },
        });
        toast.success(`Bomba ${pumpId}, Manguera ${hoseId} agregada exitosamente`);
      }
      setModalOpen(false);
      fetchHoses();
    } catch (err: any) {
      toast.error('Error al guardar manguera: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingHose(false);
    }
  };

  const handleDeleteHose = async () => {
    if (!hoseToDelete?.id || !selectedStore?.code) return;
    setDeletingHose(true);
    try {
      await api.delete(`/hoses/${hoseToDelete.id}`, {
        headers: { 'x-store-code': selectedStore.code },
      });
      toast.success('Manguera eliminada correctamente');
      setDeleteConfirmOpen(false);
      setHoseToDelete(null);
      fetchHoses();
    } catch (err: any) {
      toast.error('Error al eliminar manguera: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingHose(false);
    }
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-[400px]">
          <CardHeader><CardTitle className="text-center">Seleccione una tienda</CardTitle></CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Debe seleccionar una sucursal para ver los precios y mangueras.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background/95 backdrop-blur p-4 rounded-xl border border-border/50 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Fuel className="h-6 w-6 text-primary" />
            Mangueras y Precios de Combustible
          </h1>
          <p className="text-muted-foreground text-sm">{selectedStore.name} ({selectedStore.code})</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleOpenAddHose} className="gap-1.5 text-xs h-9">
            <Plus className="h-4 w-4" />
            Agregar Bomba / Manguera
          </Button>
          <Button variant="outline" size="sm" onClick={fetchHoses} disabled={loading} className="gap-1.5 text-xs h-9">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm flex-1 overflow-auto">
        <CardContent className="p-0">
          {loading && hoses.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hoses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Fuel className="h-12 w-12 opacity-30" />
              <p>No se encontraron mangueras configuradas para esta estación.</p>
              <Button size="sm" onClick={handleOpenAddHose} className="gap-1.5 text-xs">
                <Plus className="h-4 w-4" />
                Agregar Primera Bomba / Manguera
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/40 border-b text-xs font-bold uppercase text-muted-foreground items-center">
                <div className="col-span-2">Bomba</div>
                <div className="col-span-2">Manguera</div>
                <div className="col-span-3">Combustible</div>
                <div className="col-span-1">Tanque</div>
                <div className="col-span-2 text-right">Precio Galón</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>
              <div className="divide-y">
                {hoses.map((hose) => {
                  const gradeLabel = hose.fuelGradeName || hose.productName || hose.gradeName || 'Combustible';
                  return (
                    <div key={hose.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/10 transition-colors">
                      <div className="col-span-2 font-mono text-sm font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Bomba {hose.pumpId}
                      </div>
                      <div className="col-span-2 font-mono text-sm">
                        <span className="text-muted-foreground">Posición</span> #{hose.hoseId}
                      </div>
                      <div className="col-span-3 text-sm font-medium truncate flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          gradeLabel.includes('SUPERIOR')
                            ? 'bg-rose-500'
                            : gradeLabel.includes('REGULAR')
                            ? 'bg-amber-500'
                            : gradeLabel.includes('DIESEL')
                            ? 'bg-emerald-500'
                            : 'bg-primary'
                        }`} />
                        <span className="truncate">{gradeLabel}</span>
                      </div>
                      <div className="col-span-1 font-mono text-xs text-muted-foreground">
                        {hose.tankId ? `T-${hose.tankId}` : '-'}
                      </div>
                      <div className="col-span-2 text-right font-mono">
                        {editingId === hose.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 w-full text-right font-mono text-sm inline-block"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlinePrice(hose.id);
                              if (e.key === 'Escape') handleCancelInlinePrice();
                            }}
                          />
                        ) : (
                          <span className="text-sm font-bold text-foreground">
                            {hose.unitPrice != null ? `L. ${Number(hose.unitPrice).toFixed(2)}` : '-'}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        {editingId === hose.id ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveInlinePrice(hose.id)}
                              disabled={savingId === hose.id}
                              className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                              title="Guardar precio"
                            >
                              {savingId === hose.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelInlinePrice}
                              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted"
                              title="Cancelar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditInlinePrice(hose)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="Editar precio rápido"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditHose(hose)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              title="Editar manguera completa"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setHoseToDelete(hose);
                                setDeleteConfirmOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              title="Eliminar manguera"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hose Modal (Add / Edit) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveHoseForm}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-primary" />
                {editingHose ? 'Editar Bomba / Manguera' : 'Agregar Bomba y Manguera'}
              </DialogTitle>
              <DialogDescription>
                {editingHose
                  ? `Modifique la configuración de la bomba ${editingHose.pumpId}, manguera ${editingHose.hoseId}.`
                  : `Registre un dispensador y manguera de combustible para ${selectedStore.name}.`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="h-pumpId" className="text-xs font-medium">Bomba / Dispensador # *</Label>
                <Input
                  id="h-pumpId"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={hoseForm.pumpId}
                  onChange={(e) => setHoseForm({ ...hoseForm, pumpId: parseInt(e.target.value, 10) || 1 })}
                  required
                />
                <p className="text-[11px] text-muted-foreground">Número de dispensador (1, 2, 3...)</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="h-hoseId" className="text-xs font-medium">Manguera # *</Label>
                <Input
                  id="h-hoseId"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={hoseForm.hoseId}
                  onChange={(e) => setHoseForm({ ...hoseForm, hoseId: parseInt(e.target.value, 10) || 1 })}
                  required
                />
                <p className="text-[11px] text-muted-foreground">Posición de manguera (1, 2, 3...)</p>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="h-gradeName" className="text-xs font-medium">Combustible / Producto *</Label>
                <Input
                  id="h-gradeName"
                  list="h-fuel-grades-list"
                  placeholder="Ej. GASOLINA SUPERIOR"
                  value={hoseForm.gradeName}
                  onChange={(e) => setHoseForm({ ...hoseForm, gradeName: e.target.value.toUpperCase() })}
                  required
                />
                <datalist id="h-fuel-grades-list">
                  <option value="GASOLINA SUPERIOR" />
                  <option value="GASOLINA REGULAR" />
                  <option value="DIESEL 50PPM" />
                  <option value="DIESEL" />
                  <option value="KEROSENE" />
                  <option value="GLP" />
                </datalist>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['GASOLINA SUPERIOR', 'GASOLINA REGULAR', 'DIESEL 50PPM', 'DIESEL', 'KEROSENE', 'GLP'].map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setHoseForm({ ...hoseForm, gradeName: grade })}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        hoseForm.gradeName === grade
                          ? 'bg-primary text-primary-foreground border-primary font-medium'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="h-tankId" className="text-xs font-medium">Tanque Asociado</Label>
                <Input
                  id="h-tankId"
                  placeholder="1"
                  value={hoseForm.tankId}
                  onChange={(e) => setHoseForm({ ...hoseForm, tankId: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">Ej. 1, 2, o T-1 (Opcional)</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="h-unitPrice" className="text-xs font-medium">Precio por Galón (L.)</Label>
                <Input
                  id="h-unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={hoseForm.unitPrice}
                  onChange={(e) => setHoseForm({ ...hoseForm, unitPrice: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">Precio en Lempiras</p>
              </div>

              <div className="col-span-2 flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold">Manguera Habilitada / Activa</div>
                  <div className="text-[11px] text-muted-foreground">Habilitar despacho en pista y controlador POS</div>
                </div>
                <input
                  type="checkbox"
                  checked={hoseForm.active}
                  onChange={(e) => setHoseForm({ ...hoseForm, active: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingHose}>
                {savingHose ? 'Guardando...' : editingHose ? 'Guardar Cambios' : 'Agregar Manguera'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Eliminar Manguera
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la Manguera #{hoseToDelete?.hoseId} de la Bomba {hoseToDelete?.pumpId} ({hoseToDelete?.gradeName || hoseToDelete?.fuelGradeName})?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteHose} disabled={deletingHose}>
              {deletingHose ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
