import api from '../infrastructure/api/api-client';

export interface AccountItem {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'COST' | 'EXPENSE';
  nature: 'DEBIT' | 'CREDIT';
  level: number;
  parentId?: string | null;
  allowsMovement: boolean;
  isActive: boolean;
  children?: AccountItem[];
}

export interface CostCenterItem {
  id: string;
  code: string;
  name: string;
  storeCode?: string | null;
  isActive: boolean;
}

export interface FiscalPeriodItem {
  id: string;
  year: number;
  month: number;
  status: 'OPEN' | 'CLOSED';
  closedAt?: string | null;
  closedBy?: string | null;
}

export interface AccountingMappingItem {
  id: string;
  category: string;
  sourceIdentifier: string;
  accountId: string;
  costCenterId?: string | null;
  account?: AccountItem;
  costCenter?: CostCenterItem;
}

export interface JournalEntryLineItem {
  id?: string;
  accountId: string;
  costCenterId?: string | null;
  debit: number;
  credit: number;
  description?: string;
  account?: { id: string; code: string; name: string; type?: string; nature?: string };
  costCenter?: { id: string; code: string; name: string };
}

export interface JournalEntryItem {
  id: string;
  entryNumber: number;
  date: string;
  type: 'DIARY' | 'INCOME' | 'EXPENSE' | 'REVERSAL';
  concept: string;
  status: 'DRAFT' | 'POSTED' | 'VOIDED';
  sourceRef?: string | null;
  totalDebit: number;
  totalCredit: number;
  notes?: string | null;
  fiscalPeriodId?: string | null;
  createdById?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  lines: JournalEntryLineItem[];
}

export const accountingService = {
  // Cuentas
  async getAccounts(params?: { type?: string; allowsMovement?: boolean; search?: string }) {
    const { data } = await api.get<AccountItem[]>('/accounting/accounts', { params });
    return data;
  },

  async createAccount(payload: {
    code: string;
    name: string;
    type: string;
    nature: string;
    level: number;
    parentId?: string;
    allowsMovement?: boolean;
  }) {
    const { data } = await api.post<AccountItem>('/accounting/accounts', payload);
    return data;
  },

  async updateAccount(id: string, payload: { name?: string; allowsMovement?: boolean; isActive?: boolean }) {
    const { data } = await api.put<AccountItem>(`/accounting/accounts/${id}`, payload);
    return data;
  },

  async deleteAccount(id: string) {
    const { data } = await api.delete(`/accounting/accounts/${id}`);
    return data;
  },

  // Centros de costo
  async getCostCenters(activeOnly = false) {
    const { data } = await api.get<CostCenterItem[]>('/accounting/cost-centers', {
      params: { activeOnly },
    });
    return data;
  },

  // Periodos Fiscales
  async getFiscalPeriods(year?: number) {
    const { data } = await api.get<FiscalPeriodItem[]>('/accounting/fiscal-periods', {
      params: { year },
    });
    return data;
  },

  async closeFiscalPeriod(id: string) {
    const { data } = await api.post<FiscalPeriodItem>(`/accounting/fiscal-periods/${id}/close`);
    return data;
  },

  async reopenFiscalPeriod(id: string) {
    const { data } = await api.post<FiscalPeriodItem>(`/accounting/fiscal-periods/${id}/reopen`);
    return data;
  },

  // Mapeos
  async getMappings(category?: string, costCenterId?: string) {
    const { data } = await api.get<AccountingMappingItem[]>('/accounting/mapping', {
      params: { category, costCenterId },
    });
    return data;
  },

  async setMapping(payload: {
    category: string;
    sourceIdentifier: string;
    accountId: string;
    costCenterId?: string;
  }) {
    const { data } = await api.post<AccountingMappingItem>('/accounting/mapping', payload);
    return data;
  },

  async deleteMapping(id: string) {
    const { data } = await api.delete(`/accounting/mapping/${id}`);
    return data;
  },

  // Pólizas
  async getJournalEntries(params?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    costCenterId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { data } = await api.get<{
      items: JournalEntryItem[];
      total: number;
      page: number;
      totalPages: number;
    }>('/accounting/entries', { params });
    return data;
  },

  async getJournalEntry(id: string) {
    const { data } = await api.get<JournalEntryItem>(`/accounting/entries/${id}`);
    return data;
  },

  async createJournalEntry(payload: {
    date: string;
    type?: string;
    concept: string;
    sourceRef?: string;
    notes?: string;
    lines: Array<{
      accountId: string;
      costCenterId?: string;
      debit: number;
      credit: number;
      description?: string;
    }>;
  }) {
    const { data } = await api.post<JournalEntryItem>('/accounting/entries', payload);
    return data;
  },

  async approveJournalEntry(id: string) {
    const { data } = await api.post<JournalEntryItem>(`/accounting/entries/${id}/approve`);
    return data;
  },

  async voidJournalEntry(id: string, reason: string) {
    const { data } = await api.post<{ original: JournalEntryItem; reversal: JournalEntryItem }>(
      `/accounting/entries/${id}/void`,
      { reason },
    );
    return data;
  },

  async generateShiftEntry(shiftId: string) {
    const { data } = await api.post<JournalEntryItem>(`/accounting/entries/generate-shift/${shiftId}`);
    return data;
  },

  // Cobros de Clientes
  async registerCustomerPayment(payload: {
    customerNo: string;
    customerName: string;
    amount: number;
    date: string;
    bankAccountId: string;
    costCenterId?: string;
    referenceNumber?: string;
    notes?: string;
  }) {
    const { data } = await api.post<JournalEntryItem>('/accounting/customer-payments', payload);
    return data;
  },

  // Reportes Financieros
  async getJournalBookReport(params: { startDate: string; endDate: string; costCenterId?: string }) {
    const { data } = await api.get('/accounting/reports/journal-book', { params });
    return data;
  },

  async getGeneralLedgerReport(params: {
    startDate: string;
    endDate: string;
    accountId?: string;
    costCenterId?: string;
  }) {
    const { data } = await api.get('/accounting/reports/general-ledger', { params });
    return data;
  },

  async getTrialBalanceReport(params: { startDate: string; endDate: string; costCenterId?: string }) {
    const { data } = await api.get('/accounting/reports/trial-balance', { params });
    return data;
  },

  async getIncomeStatementReport(params: { startDate: string; endDate: string; costCenterId?: string }) {
    const { data } = await api.get('/accounting/reports/income-statement', { params });
    return data;
  },
};
