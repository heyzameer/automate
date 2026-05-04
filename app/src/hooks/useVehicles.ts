/**
 * useVehicles — Redux-backed hook.
 * Components that call this hook all share the same cached data.
 * The `condition` guard in fetchVehicles prevents duplicate API calls.
 */
import { useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store';
import {
    fetchVehicles,
    forceFetchVehicles,
    createVehicle as createVehicleThunk,
    updateVehicle as updateVehicleThunk,
    deleteVehicle as deleteVehicleThunk,
    toggleDelistVehicle,
    selectVehicles,
    selectVehiclesStatus,
    selectVehiclesSaving,
    selectVehiclesLoading,
} from '../store/slices/vehiclesSlice';
import { CreateVehiclePayload, Vehicle } from '../services/vehicle.service';

export const useVehicles = (autoFetch = true) => {
    const dispatch = useAppDispatch();
    const vehicles = useAppSelector(selectVehicles);
    const status = useAppSelector(selectVehiclesStatus);
    const saving = useAppSelector(selectVehiclesSaving);
    const loading = useAppSelector(selectVehiclesLoading);

    // Auto-fetch on mount — condition guard prevents duplicate requests
    useEffect(() => {
        if (autoFetch) {
            dispatch(fetchVehicles());
        }
    }, [dispatch, autoFetch]);

    const refetch = useCallback(() => {
        dispatch(forceFetchVehicles());
    }, [dispatch]);

    const createVehicle = useCallback(
        async (payload: CreateVehiclePayload): Promise<boolean> => {
            const result = await dispatch(createVehicleThunk(payload));
            if (createVehicleThunk.fulfilled.match(result)) {
                toast.success('Vehicle listed successfully!');
                return true;
            }
            toast.error((result.payload as string) || 'Failed to create vehicle');
            return false;
        },
        [dispatch]
    );

    const updateVehicle = useCallback(
        async (id: string, payload: Partial<Vehicle>): Promise<boolean> => {
            const result = await dispatch(updateVehicleThunk({ id, payload }));
            if (updateVehicleThunk.fulfilled.match(result)) {
                toast.success('Vehicle updated');
                return true;
            }
            toast.error((result.payload as string) || 'Failed to update vehicle');
            return false;
        },
        [dispatch]
    );

    const deleteVehicle = useCallback(
        async (id: string): Promise<boolean> => {
            const result = await dispatch(deleteVehicleThunk(id));
            if (deleteVehicleThunk.fulfilled.match(result)) {
                toast.success('Vehicle removed');
                return true;
            }
            toast.error((result.payload as string) || 'Failed to delete vehicle');
            return false;
        },
        [dispatch]
    );

    const toggleDelist = useCallback(
        async (id: string): Promise<boolean> => {
            const result = await dispatch(toggleDelistVehicle(id));
            if (toggleDelistVehicle.fulfilled.match(result)) {
                const updated = result.payload;
                toast.success(updated.isDelisted ? 'Delisted from bot' : 'Listed on bot');
                return true;
            }
            toast.error('Failed to change visibility');
            return false;
        },
        [dispatch]
    );

    return {
        vehicles,
        loading,
        saving,
        status,
        fetchVehicles: refetch,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        toggleDelist,
    };
};
