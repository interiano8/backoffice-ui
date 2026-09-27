import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useShiftStore } from '../store/useShiftStore';
import { syncMultipleShifts } from '../services/sync.service';

export function useShiftSync(globalDate: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncMessages, setSyncMessages] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');

  const syncByDate = useCallback(async () => {
    if (!globalDate) return;

    try {
      setIsSyncing(true);
      const { selectedStore } = useAppStore.getState();
      if (!selectedStore) return;

      const shiftsFromTpv = await useShiftStore.getState().getTpvShifts(globalDate);
      if (shiftsFromTpv.length === 0) return;

      const boShifts = useShiftStore.getState().shifts;
      const shiftsToSync = shiftsFromTpv.filter((tpvShift: any) => {
        const existingBoShift = boShifts.find((bo: any) =>
          bo.reconcilerShiftId === tpvShift.reconcilerShiftId ||
          (bo.shiftNo === tpvShift.shiftNo && bo.employeeName === tpvShift.employeeName)
        );
        if (existingBoShift && existingBoShift.status === 'CLOSED') return false;
        return true;
      });

      if (shiftsToSync.length === 0) {
        setIsSyncing(false);
        return;
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
      } else {
        setSyncMessages(prev => [...prev, `[ERR] ${result.error || result.message || 'Error desconocido'}`]);
        setSyncStatus('error');
      }

      setTimeout(() => useShiftStore.getState().getShifts(globalDate), 500);
    } catch (error: any) {
      setSyncMessages(prev => [...prev, `Error: ${error.message}`]);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  }, [globalDate]);

  return {
    isSyncing,
    syncModalOpen,
    syncMessages,
    syncStatus,
    syncByDate,
    setSyncModalOpen,
    setSyncStatus,
    setSyncMessages,
  };
}
