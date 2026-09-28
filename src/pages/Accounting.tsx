import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  FolderTree,
  Sliders,
  TrendingUp,
  RotateCcw,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import { AccountsCatalogTab } from './accounting/AccountsCatalogTab';
import { AccountingMappingTab } from './accounting/AccountingMappingTab';
import { JournalEntriesTab } from './accounting/JournalEntriesTab';
import { FinancialReportsTab } from './accounting/FinancialReportsTab';
import { accountingService, AccountItem, CostCenterItem } from '../services/accounting.service';

type ActiveTab = 'JOURNAL' | 'CATALOG' | 'MAPPING' | 'REPORTS';

export const AccountingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('JOURNAL');

  // Modal: Registrar Abono CxC (Customer Payment)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [customerNo, setCustomerNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentCostCenterId, setPaymentCostCenterId] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Modal: Contabilizar Turno Manualmente
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [generatingShift, setGeneratingShift] = useState(false);
  const [shiftIdInput, setShiftIdInput] = useState('');

  // Cuentas de banco y centros de costo para el modal de abono
  const [bankAccounts, setBankAccounts] = useState<AccountItem[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([]);

  const openCustomerPaymentModal = async () => {
    try {
      const [accs, ccs] = await Promise.all([
        accountingService.getAccounts({ allowsMovement: true }),
        accountingService.getCostCenters(true),
      ]);
      // Filter bank/cash accounts (assets starting with 1101 or 1102)
      const banks = accs.filter(a => a.code.startsWith('1.1.01') || a.code.startsWith('1.1.02') || a.type === 'ASSET');
      setBankAccounts(banks.length > 0 ? banks : accs);
      if (banks[0]) setBankAccountId(banks[0].id);
      setCostCenters(ccs);
      setPaymentModalOpen(true);
    } catch (err: any) {
      toast.error('Error cargando cuentas: ' + (err.message || 'Error de conexión'));
    }
  };

  const handleRegisterPayment = async () => {
    if (!customerNo.trim() || !customerName.trim() || !paymentAmount || Number(paymentAmount) <= 0 || !bankAccountId) {
      toast.error('Por favor complete los campos obligatorios del pago');
      return;
    }

    setSubmittingPayment(true);
    try {
      const entry = await accountingService.registerCustomerPayment({
        customerNo: customerNo.trim(),
        customerName: customerName.trim(),
        amount: Number(paymentAmount),
        date: paymentDate,
        bankAccountId,
        costCenterId: paymentCostCenterId || undefined,
        referenceNumber: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      toast.success(`Abono registrado con éxito. Se generó la póliza #${entry.entryNumber}`);
      setPaymentModalOpen(false);
      // Reset form
      setCustomerNo('');
      setCustomerName('');
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error registrando cobro de cliente');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleGenerateShiftEntry = async () => {
    if (!shiftIdInput.trim()) {
      toast.error('Ingrese el ID del turno a contabilizar');
      return;
    }

    setGeneratingShift(true);
    try {
      const entry = await accountingService.generateShiftEntry(shiftIdInput.trim());
      toast.success(`Turno contabilizado con éxito. Se generó la póliza borrador #${entry.entryNumber}`);
      setShiftModalOpen(false);
      setShiftIdInput('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error generando póliza del turno');
    } finally {
      setGeneratingShift(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Módulo de Contabilidad General
            </h1>
            <p className="text-xs text-muted-foreground">
              Partida doble nativa, auditoría SAR/NIIF, catálogo normativo y reportes financieros
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShiftModalOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-primary" />
            Contabilizar Turno
          </Button>

          <Button
            size="sm"
            onClick={openCustomerPaymentModal}
            className="text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5" />
            Registrar Cobro CxC
          </Button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border/60 gap-2">
        <button
          onClick={() => setActiveTab('JOURNAL')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'JOURNAL'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          Libro Diario & Pólizas
        </button>

        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'CATALOG'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Catálogo de Cuentas
        </button>

        <button
          onClick={() => setActiveTab('MAPPING')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'MAPPING'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Mapeos Operativos
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'REPORTS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Estados Financieros
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'JOURNAL' && <JournalEntriesTab />}
        {activeTab === 'CATALOG' && <AccountsCatalogTab />}
        {activeTab === 'MAPPING' && <AccountingMappingTab />}
        {activeTab === 'REPORTS' && <FinancialReportsTab />}
      </div>

      {/* Modal: Registrar Cobro CxC */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Wallet className="w-5 h-5 text-primary" />
              Registrar Cobro / Abono de Cliente (CxC)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Registra el ingreso de efectivo o transferencia de un cliente a crédito. El sistema generará una póliza contable debitando el banco y acreditando la cuenta de Clientes CxC.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Código de Cliente *
                </label>
                <Input
                  placeholder="Ej: CUST-001"
                  value={customerNo}
                  onChange={(e) => setCustomerNo(e.target.value.toUpperCase())}
                  className="font-mono text-sm uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Nombre o Razón Social *
                </label>
                <Input
                  placeholder="Ej: Transportes del Norte S.A."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Monto Recibido (Lempiras) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || '')}
                  className="font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Fecha de Depósito / Pago
                </label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Cuenta Bancaria o Caja Receptora *
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Centro de Costo (Sucursal)
                </label>
                <select
                  value={paymentCostCenterId}
                  onChange={(e) => setPaymentCostCenterId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">🌐 Global (Toda la Empresa)</option>
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.code} - {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  # Referencia / Comprobante Bancario
                </label>
                <Input
                  placeholder="Ej: Depósito #847291"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Observaciones / Notas
              </label>
              <Input
                placeholder="Detalle adicional del pago o facturas canceladas..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)} disabled={submittingPayment}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment} disabled={submittingPayment} className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              {submittingPayment ? 'Procesando...' : 'Registrar Cobro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Contabilizar Turno Manualmente */}
      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <RotateCcw className="w-5 h-5 text-primary" />
              Generar Póliza Contable de Turno
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Ingresa el ID del turno para que el generador automático extraiga las ventas de combustible, tienda, formas de pago y diferencias de arqueo, y construya la póliza borrador con partida doble.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                ID del Turno (BoShift ID)
              </label>
              <Input
                placeholder="Ej: shift-uuid-1234"
                value={shiftIdInput}
                onChange={(e) => setShiftIdInput(e.target.value.trim())}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShiftModalOpen(false)} disabled={generatingShift}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateShiftEntry} disabled={generatingShift} className="flex items-center gap-1.5">
              <RotateCcw className={`w-4 h-4 ${generatingShift ? 'animate-spin' : ''}`} />
              {generatingShift ? 'Generando...' : 'Generar Póliza'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
