import api from '../infrastructure/api/api-client';

export interface InventoryCountItem {
  id?: string;
  sessionId?: string;
  productCode: string;
  productName?: string;
  theoreticalStock: number;
  countedStock: number;
  variance: number;
  reason?: 'MERMA_ROTURA' | 'MERMA_VENCIMIENTO' | 'CONSUMO_INTERNO' | 'DESCUADRE_FISICO' | string;
  notes?: string;
}

export interface InventoryCountSession {
  id: string;
  sessionNo: string;
  storeCode: string;
  status: 'DRAFT' | 'COMPLETED' | 'APPLIED' | 'CANCELLED';
  countedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string;
  items: InventoryCountItem[];
}

export const inventoryAuditService = {
  getSessions: async (params?: { storeCode?: string; status?: string }): Promise<InventoryCountSession[]> => {
    const res = await api.get('/inventory/counts', { params });
    return res.data;
  },

  getSessionById: async (id: string): Promise<InventoryCountSession> => {
    const res = await api.get(`/inventory/counts/${id}`);
    return res.data;
  },

  createSession: async (data: {
    storeCode: string;
    countedBy?: string;
    notes?: string;
  }): Promise<InventoryCountSession> => {
    const res = await api.post('/inventory/counts', data);
    return res.data;
  },

  updateSessionItems: async (
    id: string,
    items: Array<{
      productCode: string;
      productName?: string;
      countedStock: number;
      reason?: string;
      notes?: string;
    }>,
  ): Promise<InventoryCountSession> => {
    const res = await api.put(`/inventory/counts/${id}/items`, { items });
    return res.data;
  },

  applyAdjustments: async (
    id: string,
    data?: { approvedBy?: string; notes?: string },
  ): Promise<InventoryCountSession> => {
    const res = await api.patch(`/inventory/counts/${id}/apply`, data || {});
    return res.data;
  },

  cancelSession: async (
    id: string,
    notes?: string,
  ): Promise<InventoryCountSession> => {
    const res = await api.patch(`/inventory/counts/${id}/cancel`, { notes });
    return res.data;
  },

  getLowStockAlerts: async (storeCode?: string): Promise<LowStockAlertItem[]> => {
    const res = await api.get('/inventory/alerts/low-stock', {
      params: storeCode ? { storeCode } : undefined,
    });
    return res.data;
  },

  updateThresholds: async (
    storeCode: string,
    items: Array<{ productCode: string; minStock: number }>,
  ): Promise<any> => {
    const res = await api.put('/inventory/thresholds', { storeCode, items });
    return res.data;
  },
};

export interface LowStockAlertItem {
  id: string;
  storeCode: string;
  storeName: string;
  productCode: string;
  productName?: string;
  stock: number;
  minStock: number;
  criticality: 'OUT_OF_STOCK' | 'CRITICAL' | 'WARNING';
  suggestedReorder: number;
  updatedAt: string;
}

