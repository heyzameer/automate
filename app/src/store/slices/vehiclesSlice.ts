import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { vehicleService, Vehicle, CreateVehiclePayload } from '../../services/vehicle.service';

// ─── State ───────────────────────────────────────────────────────────────────
interface VehiclesState {
    items: Vehicle[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    saving: boolean;
}

const initialState: VehiclesState = {
    items: [],
    status: 'idle',
    error: null,
    saving: false,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────
export const fetchVehicles = createAsyncThunk(
    'vehicles/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            return await vehicleService.getAll();
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch vehicles');
        }
    },
    {
        // Don't re-fetch if already succeeded and data exists
        condition: (_, { getState }) => {
            const { vehicles } = getState() as { vehicles: VehiclesState };
            return vehicles.status !== 'loading' && vehicles.status !== 'succeeded';
        },
    }
);

export const forceFetchVehicles = createAsyncThunk(
    'vehicles/forceFetchAll',
    async (_, { rejectWithValue }) => {
        try {
            return await vehicleService.getAll();
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch vehicles');
        }
    }
);

export const createVehicle = createAsyncThunk(
    'vehicles/create',
    async (payload: CreateVehiclePayload, { rejectWithValue }) => {
        try {
            return await vehicleService.create(payload);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to create vehicle');
        }
    }
);

export const updateVehicle = createAsyncThunk(
    'vehicles/update',
    async ({ id, payload }: { id: string; payload: Partial<Vehicle> }, { rejectWithValue }) => {
        try {
            return await vehicleService.update(id, payload);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to update vehicle');
        }
    }
);

export const deleteVehicle = createAsyncThunk(
    'vehicles/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            await vehicleService.delete(id);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to delete vehicle');
        }
    }
);

export const toggleDelistVehicle = createAsyncThunk(
    'vehicles/toggleDelist',
    async (id: string, { rejectWithValue }) => {
        try {
            return await vehicleService.toggleDelist(id);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to change visibility');
        }
    }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const vehiclesSlice = createSlice({
    name: 'vehicles',
    initialState,
    reducers: {
        invalidateVehicles: (state) => {
            state.status = 'idle';
        },
        optimisticDelete: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(
                (v) => (v._id || v.id) !== action.payload
            );
        },
    },
    extraReducers: (builder) => {
        // ── fetchVehicles ──────────────────────────────────────────────────
        builder
            .addCase(fetchVehicles.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchVehicles.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchVehicles.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });

        // ── forceFetchVehicles ─────────────────────────────────────────────
        builder
            .addCase(forceFetchVehicles.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(forceFetchVehicles.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(forceFetchVehicles.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });

        // ── createVehicle ──────────────────────────────────────────────────
        builder
            .addCase(createVehicle.pending, (state) => {
                state.saving = true;
            })
            .addCase(createVehicle.fulfilled, (state, action) => {
                state.saving = false;
                state.items.unshift(action.payload);
            })
            .addCase(createVehicle.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // ── updateVehicle ──────────────────────────────────────────────────
        builder
            .addCase(updateVehicle.pending, (state) => {
                state.saving = true;
            })
            .addCase(updateVehicle.fulfilled, (state, action) => {
                state.saving = false;
                const idx = state.items.findIndex(
                    (v) => (v._id || v.id) === (action.payload._id || action.payload.id)
                );
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(updateVehicle.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // ── deleteVehicle ──────────────────────────────────────────────────
        builder
            .addCase(deleteVehicle.fulfilled, (state, action) => {
                state.items = state.items.filter(
                    (v) => (v._id || v.id) !== action.payload
                );
            });

        // ── toggleDelistVehicle ────────────────────────────────────────────
        builder
            .addCase(toggleDelistVehicle.fulfilled, (state, action) => {
                const idx = state.items.findIndex(
                    (v) => (v._id || v.id) === (action.payload._id || action.payload.id)
                );
                if (idx !== -1) state.items[idx] = action.payload;
            });
    },
});

export const { invalidateVehicles, optimisticDelete } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectVehicles = (state: { vehicles: VehiclesState }) => state.vehicles.items;
export const selectVehiclesStatus = (state: { vehicles: VehiclesState }) => state.vehicles.status;
export const selectVehiclesSaving = (state: { vehicles: VehiclesState }) => state.vehicles.saving;
export const selectVehiclesLoading = (state: { vehicles: VehiclesState }) =>
    state.vehicles.status === 'loading';
export const selectVehicleById = (id: string) => (state: { vehicles: VehiclesState }) =>
    state.vehicles.items.find((v) => (v._id || v.id) === id);
