import { useState, useCallback, useEffect } from 'react';
import { vehicleService, Vehicle, CreateVehiclePayload } from '../services/vehicle.service';
import toast from 'react-hot-toast';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch {
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const createVehicle = useCallback(async (payload: CreateVehiclePayload): Promise<boolean> => {
    setSaving(true);
    try {
      await vehicleService.create(payload);
      toast.success('Vehicle listed successfully!');
      await fetchVehicles();
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to create vehicle');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchVehicles]);

  const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
    try {
      await vehicleService.delete(id);
      toast.success('Vehicle removed');
      setVehicles(prev => prev.filter(v => (v._id || v.id) !== id));
      return true;
    } catch {
      toast.error('Failed to delete vehicle');
      return false;
    }
  }, []);

  const updateVehicle = useCallback(async (id: string, payload: Partial<CreateVehiclePayload>): Promise<boolean> => {
    setSaving(true);
    try {
      const updated = await vehicleService.update(id, payload);
      setVehicles(prev => prev.map(v => (v._id || v.id) === id ? updated : v));
      toast.success('Vehicle updated');
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to update vehicle');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    vehicles,
    loading,
    saving,
    fetchVehicles,
    createVehicle,
    deleteVehicle,
    updateVehicle,
  };
};
