import api from '../lib/api';
import { API_ENDPOINTS } from '../constants/endpoints';

export interface ServiceRecord {
  date: string;
  type: string;
  cost: number;
  notes?: string;
  receipts: string[];
}

export interface Vehicle {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  year: number;
  km_driven: number;
  fuel: string;
  transmission: string;
  ownership: string;
  type: 'bike' | 'car';
  status: 'available' | 'reserved' | 'booked' | 'sold' | 'archived';
  images?: string[];
  spin_images?: string[]; // 360 view images
  city?: string;
  area?: string;
  isNegotiable?: boolean;
  purchasePrice?: number;
  refurbishmentCost?: number;
  service_history?: ServiceRecord[];
  otherExpenses?: number;
  sellingPrice?: number;
  insuranceExpiry?: string;
  rcNumber?: string;
  rcExpiry?: string;
  isDelisted?: boolean;
  bookingDetails?: string;
  attributes: Record<string, any>;
  createdAt?: string;
}

export interface CreateVehiclePayload {
  name: string;
  price: number;
  year: number;
  km_driven: number;
  fuel: string;
  transmission: string;
  ownership: string;
  type: string;
  status: string;
  city?: string;
  area?: string;
  isNegotiable?: boolean;
  images?: string[];
}

// Simple in-memory cache to reduce redundant API calls
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCached = async (key: string, fetcher: () => Promise<any>) => {
  const now = Date.now();
  if (cache[key] && (now - cache[key].timestamp < CACHE_TTL)) {
    return cache[key].data;
  }
  const data = await fetcher();
  cache[key] = { data, timestamp: now };
  return data;
};

export const vehicleService = {
  getAll: async (): Promise<Vehicle[]> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.BASE);
    return data.data.vehicles || [];
  },

  getById: async (id: string): Promise<Vehicle> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.BY_ID(id));
    return data.data.vehicle;
  },

  create: async (payload: CreateVehiclePayload): Promise<Vehicle> => {
    const { data } = await api.post(API_ENDPOINTS.VEHICLES.BASE, payload);
    // Clear relevant caches after modification
    delete cache['form_config'];
    delete cache['brands'];
    return data.data.vehicle;
  },

  update: async (id: string, payload: Partial<Vehicle>): Promise<Vehicle> => {
    const { data } = await api.patch(API_ENDPOINTS.VEHICLES.BY_ID(id), payload);
    return data.data.vehicle;
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    const { data } = await api.post(API_ENDPOINTS.VEHICLES.UPLOAD_IMAGES, formData);
    return data.data.urls;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.VEHICLES.BY_ID(id));
  },

  getFormConfig: async (): Promise<any> => {
    return getCached('form_config', async () => {
      const { data } = await api.get(API_ENDPOINTS.VEHICLES.CONFIG);
      return data.data.config;
    });
  },

  getBrands: async (): Promise<any[]> => {
    return getCached('brands', async () => {
      const { data } = await api.get(API_ENDPOINTS.VEHICLES.BRANDS);
      return data.data.brands;
    });
  },

  getModels: async (brandId: string): Promise<any[]> => {
    return getCached(`models_${brandId}`, async () => {
      const { data } = await api.get(API_ENDPOINTS.VEHICLES.MODELS(brandId));
      return data.data.models;
    });
  },

  getDropdownOptions: async (fieldName: string): Promise<string[]> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.DROPDOWN(fieldName));
    return data.data.options;
  },

  getNextCode: async (): Promise<string> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.NEXT_CODE);
    return data.data.carCode;
  },
  checkCarCode: async (code: string): Promise<boolean> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.CHECK_CODE(code));
    return data.data.available;
  },
  toggleDelist: async (id: string): Promise<Vehicle> => {
    const { data } = await api.post(`${API_ENDPOINTS.VEHICLES.BASE}/${id}/toggle-delist`);
    return data.data.vehicle;
  },

  // Admin Configuration Methods
  createBrand: async (name: string, category: string): Promise<any> => {
    const { data } = await api.post(`/inventory/admin/brands`, { name, category });
    return data.data.brand;
  },
  deleteBrand: async (id: string): Promise<void> => {
    await api.delete(`/inventory/admin/brands/${id}`);
  },
  createModel: async (name: string, brand: string): Promise<any> => {
    const { data } = await api.post(`/inventory/admin/models`, { name, brand });
    return data.data.model;
  },
  deleteModel: async (id: string): Promise<void> => {
    await api.delete(`/inventory/admin/models/${id}`);
  },
  updateDropdown: async (fieldName: string, options: string[]): Promise<any> => {
    const { data } = await api.patch(`/inventory/admin/dropdown/${fieldName}`, { options });
    return data.data.dropdown;
  },
  updateFormField: async (fieldName: string, updates: any): Promise<any> => {
    const { data } = await api.patch(`/inventory/admin/config/form/fields/${fieldName}`, updates);
    return data.data.config;
  },
  addFormField: async (fieldData: any): Promise<any> => {
    const { data } = await api.post(`/inventory/admin/config/form/fields`, fieldData);
    return data.data.config;
  },
  deleteFormField: async (fieldName: string): Promise<void> => {
    await api.delete(`/inventory/admin/config/form/fields/${fieldName}`);
  },
};
