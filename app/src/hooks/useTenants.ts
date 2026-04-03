import { useState, useCallback, useEffect } from 'react';
import { tenantService, TenantPayload } from '../services/tenant.service';
import { Tenant } from '../types';
import toast from 'react-hot-toast';

export const useTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tenantService.getAllTenants();
      setTenants(data);
    } catch {
      toast.error("Failed to fetch showrooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await tenantService.updateTenantStatus(id, !currentStatus);
      toast.success("Status updated");
      await fetchTenants();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const updatePlan = async (id: string, payload: Partial<TenantPayload>) => {
    setSaving(true);
    try {
      await tenantService.updateTenantPlan(id, payload);
      toast.success("Plan updated successfully!");
      await fetchTenants();
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  const addTenant = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      await tenantService.registerTenant(payload);
      toast.success("Showroom added successfully!");
      await fetchTenants();
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Failed to add showroom");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const assignBot = async (id: string, botForm: any) => {
    setSaving(true);
    try {
      await tenantService.assignBotToTenant(id, botForm);
      toast.success("WhatsApp Bot connected successfully!");
      fetchTenants();
      return true;
    } catch {
      toast.error("Failed to connect bot");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    tenants,
    loading,
    saving,
    fetchTenants,
    toggleStatus,
    updatePlan,
    addTenant,
    assignBot
  };
};
