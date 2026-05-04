import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService, AuthTenant } from '../../services/auth.service';

// ─── State ───────────────────────────────────────────────────────────────────
interface TenantState {
    tenant: AuthTenant | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: TenantState = {
    tenant: null,
    status: 'idle',
    error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────
export const fetchTenant = createAsyncThunk(
    'tenant/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const result = await authService.getMyTenant();
            return result.tenant ?? null;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch tenant');
        }
    },
    {
        // Prevent duplicate in-flight requests
        condition: (_, { getState }) => {
            const { tenant } = getState() as { tenant: TenantState };
            return tenant.status !== 'loading';
        },
    }
);

export const updateTenantData = createAsyncThunk(
    'tenant/update',
    async (payload: Partial<AuthTenant>, { rejectWithValue }) => {
        try {
            // Optimistic — just returns the payload merged over current data
            return payload;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const tenantSlice = createSlice({
    name: 'tenant',
    initialState,
    reducers: {
        clearTenant: (state) => {
            state.tenant = null;
            state.status = 'idle';
            state.error = null;
        },
        patchTenant: (state, action: PayloadAction<Partial<AuthTenant>>) => {
            if (state.tenant) {
                state.tenant = { ...state.tenant, ...action.payload };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTenant.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchTenant.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.tenant = action.payload;
            })
            .addCase(fetchTenant.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { clearTenant, patchTenant } = tenantSlice.actions;
export default tenantSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectTenant = (state: { tenant: TenantState }) => state.tenant.tenant;
export const selectTenantStatus = (state: { tenant: TenantState }) => state.tenant.status;
export const selectTenantError = (state: { tenant: TenantState }) => state.tenant.error;
export const selectTenantLoading = (state: { tenant: TenantState }) =>
    state.tenant.status === 'loading';
