import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { vehicleService } from '../../services/vehicle.service';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'boolean';
    options?: string[];
    required: boolean;
    placeholder?: string;
    category?: string;
    defaultValue?: any;
    isActive?: boolean;
}

export interface Brand {
    _id: string;
    name: string;
    category?: string;
}

export interface Model {
    _id: string;
    name: string;
    brand: string;
}

// ─── State ───────────────────────────────────────────────────────────────────
interface VehicleFormState {
    fields: FormField[];
    brands: Brand[];
    models: Model[];
    modelsForBrand: string | null; // tracks which brandId models are for
    fieldsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    brandsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    modelsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    fieldsFetchedAt: number | null;
    brandsFetchedAt: number | null;
}

/** 10-minute TTL — form config and brands are static reference data */
const STATIC_TTL_MS = 10 * 60 * 1000;

const initialState: VehicleFormState = {
    fields: [],
    brands: [],
    models: [],
    modelsForBrand: null,
    fieldsStatus: 'idle',
    brandsStatus: 'idle',
    modelsStatus: 'idle',
    error: null,
    fieldsFetchedAt: null,
    brandsFetchedAt: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────
export const fetchFormConfig = createAsyncThunk(
    'vehicleForm/fetchConfig',
    async (_, { rejectWithValue }) => {
        try {
            return await vehicleService.getFormConfig();
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to load form config');
        }
    },
    {
        condition: (_, { getState }) => {
            const { vehicleForm } = getState() as { vehicleForm: VehicleFormState };
            if (vehicleForm.fieldsStatus === 'loading') return false;
            if (vehicleForm.fieldsStatus === 'succeeded' && vehicleForm.fieldsFetchedAt) {
                return Date.now() - vehicleForm.fieldsFetchedAt > STATIC_TTL_MS;
            }
            return true;
        },
    }
);

export const fetchBrands = createAsyncThunk(
    'vehicleForm/fetchBrands',
    async (_, { rejectWithValue }) => {
        try {
            return await vehicleService.getBrands();
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to load brands');
        }
    },
    {
        condition: (_, { getState }) => {
            const { vehicleForm } = getState() as { vehicleForm: VehicleFormState };
            if (vehicleForm.brandsStatus === 'loading') return false;
            if (vehicleForm.brandsStatus === 'succeeded' && vehicleForm.brandsFetchedAt) {
                return Date.now() - vehicleForm.brandsFetchedAt > STATIC_TTL_MS;
            }
            return true;
        },
    }
);

export const fetchModels = createAsyncThunk(
    'vehicleForm/fetchModels',
    async (brandId: string, { rejectWithValue, getState }) => {
        const { vehicleForm } = getState() as { vehicleForm: VehicleFormState };
        // Already have models for this brand — skip
        if (vehicleForm.modelsForBrand === brandId && vehicleForm.modelsStatus === 'succeeded') {
            return { models: vehicleForm.models, brandId };
        }
        try {
            const models = await vehicleService.getModels(brandId);
            return { models, brandId };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to load models');
        }
    }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const vehicleFormSlice = createSlice({
    name: 'vehicleForm',
    initialState,
    reducers: {
        clearModels: (state) => {
            state.models = [];
            state.modelsForBrand = null;
            state.modelsStatus = 'idle';
        },
        invalidateFormConfig: (state) => {
            state.fieldsStatus = 'idle';
            state.brandsStatus = 'idle';
        },
    },
    extraReducers: (builder) => {
        // ── fetchFormConfig ────────────────────────────────────────────────
        builder
            .addCase(fetchFormConfig.pending, (state) => {
                state.fieldsStatus = 'loading';
            })
            .addCase(fetchFormConfig.fulfilled, (state, action) => {
                state.fieldsStatus = 'succeeded';
                state.fieldsFetchedAt = Date.now();
                state.fields = action.payload?.fields?.filter((f: FormField) => f.isActive) ?? [];
            })
            .addCase(fetchFormConfig.rejected, (state, action) => {
                state.fieldsStatus = 'failed';
                state.error = action.payload as string;
            });

        // ── fetchBrands ────────────────────────────────────────────────────
        builder
            .addCase(fetchBrands.pending, (state) => {
                state.brandsStatus = 'loading';
            })
            .addCase(fetchBrands.fulfilled, (state, action) => {
                state.brandsStatus = 'succeeded';
                state.brandsFetchedAt = Date.now();
                state.brands = action.payload ?? [];
            })
            .addCase(fetchBrands.rejected, (state, action) => {
                state.brandsStatus = 'failed';
                state.error = action.payload as string;
            });

        // ── fetchModels ────────────────────────────────────────────────────
        builder
            .addCase(fetchModels.pending, (state) => {
                state.modelsStatus = 'loading';
            })
            .addCase(fetchModels.fulfilled, (state, action) => {
                state.modelsStatus = 'succeeded';
                state.models = action.payload.models;
                state.modelsForBrand = action.payload.brandId;
            })
            .addCase(fetchModels.rejected, (state, action) => {
                state.modelsStatus = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { clearModels, invalidateFormConfig } = vehicleFormSlice.actions;
export default vehicleFormSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────
type RootState = { vehicleForm: VehicleFormState };
export const selectFormFields = (s: RootState) => s.vehicleForm.fields;
export const selectBrands = (s: RootState) => s.vehicleForm.brands;
export const selectModels = (s: RootState) => s.vehicleForm.models;
export const selectFormConfigLoading = (s: RootState) => s.vehicleForm.fieldsStatus === 'loading';
export const selectBrandsLoading = (s: RootState) => s.vehicleForm.brandsStatus === 'loading';
export const selectModelsLoading = (s: RootState) => s.vehicleForm.modelsStatus === 'loading';
export const selectModelsForBrand = (s: RootState) => s.vehicleForm.modelsForBrand;
export const selectFormReady = (s: RootState) =>
    s.vehicleForm.fieldsStatus === 'succeeded' && s.vehicleForm.brandsStatus === 'succeeded';
