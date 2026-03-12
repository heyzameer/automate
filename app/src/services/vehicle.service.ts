import api from '../lib/api';
import { API_ENDPOINTS } from '../constants/endpoints';

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
  status: 'Available' | 'Reserved' | 'Sold';
  images?: string[];
  city?: string;
  area?: string;
  isNegotiable?: boolean;
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
}

export const vehicleService = {
  getAll: async (): Promise<Vehicle[]> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.BASE);
    return data.data;
  },

  getById: async (id: string): Promise<Vehicle> => {
    const { data } = await api.get(API_ENDPOINTS.VEHICLES.BY_ID(id));
    return data.data;
  },

  create: async (payload: CreateVehiclePayload): Promise<Vehicle> => {
    const { data } = await api.post(API_ENDPOINTS.VEHICLES.BASE, payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateVehiclePayload>): Promise<Vehicle> => {
    const { data } = await api.patch(API_ENDPOINTS.VEHICLES.BY_ID(id), payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.VEHICLES.BY_ID(id));
  },
};
