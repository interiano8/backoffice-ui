import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getActiveCustomers, getCustomerStatement } from '../services/report.service';
import { toast } from 'sonner';

export interface ActiveCustomer {
  customerNo: string;
  rtn: string;
  customerName: string;
  totalCredit: number;
  totalNC: number;
}

export interface StatementLine {
  docNo: string;
  docType: number;
  date: string;
  amount: number;
  charge: number;
  payment: number;
  balance: number;
  customerName: string;
  rtn: string;
  productDetails: string;
  fleetInfo: string;
  customerNo?: string;
}

export function getDocTypeName(type: number) {
  switch (type) {
    case 2: return 'Factura Crédito';
    case 3: return 'Nota de Crédito';
    case 7: return 'Ticket/Salida';
    default: return 'Documento';
  }
}

export function formatProductDetail(detail: string, asHtml: boolean = false) {
  if (!detail) return detail;
  let formatted = detail.replace(/= ([\d.]+)/g, (match, p1) => {
    const num = parseFloat(p1);
    return !isNaN(num)
      ? `= ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : match;
  });
  const parts = formatted.split(/(- [\d.]+)(?=\s*=)/);
  if (parts.length > 1) {
    if (asHtml) {
      return `${parts[0]}<span style="color: #ef4444; font-weight: bold;">${parts[1]}</span>${parts[2]}`;
    }
    return (
      <span className="flex items-center gap-0.5 whitespace-nowrap">
        {parts[0]}
        <span className="text-red-500 font-bold">{parts[1]}</span>
        {parts[2]}
      </span>
    );
  }
  return formatted;
}

export function useCustomerStatements() {
  const { selectedStore, user } = useAppStore();
  const today = new Date().toLocaleDateString('en-CA');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [customers, setCustomers] = useState<ActiveCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ActiveCustomer | null>(null);
  const [statement, setStatement] = useState<StatementLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');

  const fetchActiveCustomers = async () => {
    setLoading(true);
    try {
      const data: any = await getActiveCustomers(startDate, endDate);
      setCustomers(data);
      if (data.length === 0) {
        toast.info('No se encontraron clientes activos con movimientos en este rango.');
      }
    } catch (error) {
      toast.error('Error al cargar clientes activos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatement = async (customer: ActiveCustomer) => {
    try {
      setSelectedCustomer(customer);
      setStatement([]);
      setLoadingStatement(true);
      setView('detail');
      const data: any = await getCustomerStatement(startDate, endDate, customer.customerNo);
      setStatement(data);
    } catch (error) {
      toast.error('Error al cargar el estado de cuenta');
      setView('list');
    } finally {
      setLoadingStatement(false);
    }
  };

  return {
    selectedStore,
    user,
    today,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    customers,
    selectedCustomer,
    statement,
    loading,
    loadingStatement,
    view,
    setView,
    fetchActiveCustomers,
    fetchStatement,
  };
}
