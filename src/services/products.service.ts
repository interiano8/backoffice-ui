import api from '../infrastructure/api/api-client';

export interface Department {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  categories?: Category[];
  _count?: { products: number };
}

export interface Category {
  id: string;
  code: string;
  name: string;
  departmentId?: string | null;
  department?: Department | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { products: number };
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductBarcode {
  id: string;
  productId: string;
  barcode: string;
  active: boolean;
  createdAt?: string;
}

export interface ProductSupplier {
  id: string;
  productId: string;
  supplierId: string;
  supplierProductCode?: string | null;
  isDefault: boolean;
  supplier?: Supplier;
}

export interface ProductPrice {
  id: string;
  productId: string;
  storeCode?: string | null;
  unitPrice: number;
  startDate: string;
  endDate?: string | null;
  currencyCode: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
}

export interface Product {
  id: string;
  code: string; // SKU
  description: string;
  departmentId?: string | null;
  department?: Department | null;
  categoryId?: string | null;
  category?: Category | null;
  unitOfMeasure: string;
  taxGroup: string;
  imageUrl?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  barcodes?: ProductBarcode[];
  suppliers?: ProductSupplier[];
  prices?: ProductPrice[];
}

export const productsService = {
  // ===== PRODUCTOS =====
  getProducts: async (params?: {
    search?: string;
    departmentId?: string;
    categoryId?: string;
    activeOnly?: boolean;
  }): Promise<Product[]> => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  createProduct: async (data: {
    code: string;
    description: string;
    departmentId?: string;
    categoryId?: string;
    unitOfMeasure?: string;
    taxGroup?: string;
    imageUrl?: string;
    active?: boolean;
    barcodes?: string[];
    suppliers?: Array<{ supplierId: string; supplierProductCode?: string; isDefault?: boolean }>;
  }): Promise<Product> => {
    const res = await api.post('/products', data);
    return res.data;
  },

  updateProduct: async (
    id: string,
    data: Omit<Partial<Product>, 'barcodes' | 'suppliers'> & {
      barcodes?: string[];
      suppliers?: Array<{ supplierId: string; supplierProductCode?: string; isDefault?: boolean }>;
    },
  ): Promise<Product> => {
    const res = await api.patch(`/products/${id}`, data);
    return res.data;
  },

  toggleProduct: async (id: string): Promise<Product> => {
    const res = await api.patch(`/products/${id}/toggle`);
    return res.data;
  },

  // ===== PRECIOS =====
  getPrices: async (params?: {
    productId?: string;
    storeCode?: string;
    activeOnly?: boolean;
  }): Promise<ProductPrice[]> => {
    const res = await api.get('/product-prices', { params });
    return res.data;
  },

  createPrice: async (data: {
    productId: string;
    storeCode?: string | null;
    unitPrice: number;
    startDate: string;
    endDate?: string | null;
    currencyCode?: string;
    active?: boolean;
  }): Promise<ProductPrice> => {
    const res = await api.post('/product-prices', data);
    return res.data;
  },

  updatePrice: async (id: string, data: Partial<ProductPrice>): Promise<ProductPrice> => {
    const res = await api.patch(`/product-prices/${id}`, data);
    return res.data;
  },

  togglePrice: async (id: string): Promise<ProductPrice> => {
    const res = await api.patch(`/product-prices/${id}/toggle`);
    return res.data;
  },

  // ===== DEPARTAMENTOS =====
  getDepartments: async (activeOnly = false): Promise<Department[]> => {
    const res = await api.get('/departments', { params: { activeOnly } });
    return res.data;
  },

  createDepartment: async (data: { code: string; name: string; active?: boolean }): Promise<Department> => {
    const res = await api.post('/departments', data);
    return res.data;
  },

  updateDepartment: async (id: string, data: { name?: string; active?: boolean }): Promise<Department> => {
    const res = await api.patch(`/departments/${id}`, data);
    return res.data;
  },

  toggleDepartment: async (id: string): Promise<Department> => {
    const res = await api.patch(`/departments/${id}/toggle`);
    return res.data;
  },

  // ===== CATEGORÍAS =====
  getCategories: async (departmentId?: string, activeOnly = false): Promise<Category[]> => {
    const res = await api.get('/departments/categories', {
      params: { departmentId, activeOnly },
    });
    return res.data;
  },

  createCategory: async (data: {
    code: string;
    name: string;
    departmentId?: string;
    active?: boolean;
  }): Promise<Category> => {
    const res = await api.post('/departments/categories', data);
    return res.data;
  },

  updateCategory: async (
    id: string,
    data: { name?: string; departmentId?: string; active?: boolean },
  ): Promise<Category> => {
    const res = await api.patch(`/departments/categories/${id}`, data);
    return res.data;
  },

  toggleCategory: async (id: string): Promise<Category> => {
    const res = await api.patch(`/departments/categories/${id}/toggle`);
    return res.data;
  },

  // ===== PROVEEDORES =====
  getSuppliers: async (activeOnly = false): Promise<Supplier[]> => {
    const res = await api.get('/suppliers', { params: { activeOnly } });
    return res.data;
  },

  createSupplier: async (data: {
    code: string;
    name: string;
    taxId?: string;
    phone?: string;
    email?: string;
    address?: string;
    active?: boolean;
  }): Promise<Supplier> => {
    const res = await api.post('/suppliers', data);
    return res.data;
  },

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.patch(`/suppliers/${id}`, data);
    return res.data;
  },

  toggleSupplier: async (id: string): Promise<Supplier> => {
    const res = await api.patch(`/suppliers/${id}/toggle`);
    return res.data;
  },

  // ===== UNIDADES DE MEDIDA =====
  getUnitsOfMeasure: async (activeOnly = false): Promise<UnitOfMeasure[]> => {
    const res = await api.get('/units-of-measure', { params: { activeOnly } });
    return res.data;
  },

  createUnitOfMeasure: async (data: { code: string; name: string; active?: boolean }): Promise<UnitOfMeasure> => {
    const res = await api.post('/units-of-measure', data);
    return res.data;
  },

  updateUnitOfMeasure: async (id: string, data: { name?: string; active?: boolean }): Promise<UnitOfMeasure> => {
    const res = await api.patch(`/units-of-measure/${id}`, data);
    return res.data;
  },

  toggleUnitOfMeasure: async (id: string): Promise<UnitOfMeasure> => {
    const res = await api.patch(`/units-of-measure/${id}/toggle`);
    return res.data;
  },
};

