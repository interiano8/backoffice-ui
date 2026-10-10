import api from '../infrastructure/api/api-client';

export interface TransferItem {
  id?: string;
  productCode: string;
  productName?: string;
  quantityRequested: number;
  quantityDispatched?: number;
  quantityReceived?: number;
}

export interface StockTransfer {
  id: string;
  transferNo: string;
  fromStoreCode: string;
  toStoreCode: string;
  status: 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  requestedBy: string;
  approvedBy?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  items: TransferItem[];
}

export const transfersService = {
  getTransfers: async (params?: { storeCode?: string; status?: string }): Promise<StockTransfer[]> => {
    const res = await api.get('/transfers', { params });
    return res.data;
  },

  getTransferById: async (id: string): Promise<StockTransfer> => {
    const res = await api.get(`/transfers/${id}`);
    return res.data;
  },

  createTransfer: async (data: {
    fromStoreCode: string;
    toStoreCode: string;
    requestedBy: string;
    notes?: string;
    items: Array<{ productCode: string; productName?: string; quantity: number }>;
  }): Promise<StockTransfer> => {
    const res = await api.post('/transfers', data);
    return res.data;
  },

  approveTransfer: async (id: string, approvedBy?: string): Promise<StockTransfer> => {
    const res = await api.patch(`/transfers/${id}/approve`, { approvedBy });
    return res.data;
  },

  dispatchTransfer: async (id: string, dispatchedBy?: string): Promise<StockTransfer> => {
    const res = await api.patch(`/transfers/${id}/dispatch`, { dispatchedBy });
    return res.data;
  },

  receiveTransfer: async (id: string, receivedBy?: string): Promise<StockTransfer> => {
    const res = await api.patch(`/transfers/${id}/receive`, { receivedBy });
    return res.data;
  },

  cancelTransfer: async (id: string, reason?: string): Promise<StockTransfer> => {
    const res = await api.patch(`/transfers/${id}/cancel`, { reason });
    return res.data;
  },
};
