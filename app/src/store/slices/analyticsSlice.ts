import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { analyticsService, DashboardStats } from '../../services/analytics.service';

// ─── State ────────────────────────────────────────────────────────────────────
interface AnalyticsState {
    dashboard: DashboardStats | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    /** Timestamp (ms) of last successful fetch — used for TTL-based stale check */
    fetchedAt: number | null;
}

const initialState: AnalyticsState = {
    dashboard: null,
    status: 'idle',
    error: null,
    fetchedAt: null,
};

/** Re-fetch if cache is older than TTL_MS (default 2 minutes) */
const TTL_MS = 2 * 60 * 1000;

// ─── Thunks ──────────────────────────────────────────────────────────────────
export const fetchDashboardStats = createAsyncThunk(
    'analytics/fetchDashboard',
    async (_, { rejectWithValue }) => {
        try {
            return await analyticsService.getDashboardStats();
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch dashboard stats');
        }
    },
    {
        // Skip if a request is already in-flight or cached data is still fresh
        condition: (_, { getState }) => {
            const { analytics } = getState() as { analytics: AnalyticsState };
            if (analytics.status === 'loading') return false;
            if (analytics.status === 'succeeded' && analytics.fetchedAt) {
                return Date.now() - analytics.fetchedAt > TTL_MS;
            }
            return true;
        },
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        invalidateDashboard: (state) => {
            state.status = 'idle';
            state.fetchedAt = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.dashboard = action.payload;
                state.fetchedAt = Date.now();
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { invalidateDashboard } = analyticsSlice.actions;
export default analyticsSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
type RootState = { analytics: AnalyticsState };
export const selectDashboardStats   = (s: RootState) => s.analytics.dashboard;
export const selectAnalyticsStatus  = (s: RootState) => s.analytics.status;
export const selectAnalyticsLoading = (s: RootState) => s.analytics.status === 'loading';
