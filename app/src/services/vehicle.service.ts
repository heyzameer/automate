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
  status: 'available' | 'reserved' | 'sold' | 'archived';
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
    return data.data.vehicle;
  },

  update: async (id: string, payload: Partial<CreateVehiclePayload>): Promise<Vehicle> => {
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
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.CONFIG);
    return data.data.config;
  },

  getBrands: async (): Promise<any[]> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.BRANDS);
    return data.data.brands;
  },

  getModels: async (brandId: string): Promise<any[]> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.MODELS(brandId));
    return data.data.models;
  },

  getDropdownOptions: async (fieldName: string): Promise<string[]> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.DROPDOWN(fieldName));
    return data.data.options;
  },

  checkCarCode: async (code: string): Promise<boolean> => {
    const { data } = await api.get(`/vehicles/check-code/${code}`);
    return data.data.available;
  },
};
