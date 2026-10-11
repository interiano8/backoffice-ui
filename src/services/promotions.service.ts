import api from '../infrastructure/api/api-client';

export interface PromotionItem {
  id?: string;
  productCode: string;
  productName?: string;
  quantityRequired: number;
  isReward?: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'FIXED_PRICE_COMBO' | 'PERCENT_DISCOUNT' | 'BUY_X_GET_Y' | string;
  fixedPrice?: number;
  discountPct?: number;
  startDate?: string;
  endDate?: string;
  storeCode?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  items: PromotionItem[];
}

export interface PromotionEvaluationResult {
  originalSubtotal: number;
  totalDiscount: number;
  finalTotal: number;
  appliedPromotions: Array<{
    promotionCode: string;
    promotionName: string;
    type: string;
    discountAmount: number;
    details: string;
  }>;
}

export const promotionsService = {
  getPromotions: async (params?: { storeCode?: string; activeOnly?: boolean }): Promise<Promotion[]> => {
    const res = await api.get('/promotions', { params });
    return res.data;
  },

  getPromotionById: async (id: string): Promise<Promotion> => {
    const res = await api.get(`/promotions/${id}`);
    return res.data;
  },

  createPromotion: async (data: {
    code: string;
    name: string;
    description?: string;
    type: string;
    fixedPrice?: number;
    discountPct?: number;
    startDate?: string;
    endDate?: string;
    storeCode?: string;
    items: Array<{
      productCode: string;
      productName?: string;
      quantityRequired: number;
      isReward?: boolean;
    }>;
  }): Promise<Promotion> => {
    const res = await api.post('/promotions', data);
    return res.data;
  },

  togglePromotion: async (id: string): Promise<Promotion> => {
    const res = await api.patch(`/promotions/${id}/toggle`);
    return res.data;
  },

  deletePromotion: async (id: string): Promise<any> => {
    const res = await api.delete(`/promotions/${id}`);
    return res.data;
  },

  evaluateCart: async (data: {
    storeCode?: string;
    items: Array<{
      productCode: string;
      productName?: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<PromotionEvaluationResult> => {
    const res = await api.post('/promotions/evaluate', data);
    return res.data;
  },
};
