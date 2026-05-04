import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { leadsService, Lead } from '../../services/leads.service';

// ─── State ───────────────────────────────────────────────────────────────────
interface LeadsState {
    items: Lead[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: LeadsState = {
    items: [],
    status: 'idle',
    error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────
export const fetchLeads = createAsyncThunk(
    'leads/fetchAll',
    async (tenantId: string | undefined, { rejectWithValue }) => {
        try {
            return await leadsService.getLeads(tenantId);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch leads');
        }
    },
    {
        condition: (_, { getState }) => {
            const { leads } = getState() as { leads: LeadsState };
            return leads.status !== 'loading' && leads.status !== 'succeeded';
        },
    }
);

export const forceFetchLeads = createAsyncThunk(
    'leads/forceFetchAll',
    async (tenantId: string | undefined, { rejectWithValue }) => {
        try {
            return await leadsService.getLeads(tenantId);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch leads');
        }
    }
);

export const updateLead = createAsyncThunk(
    'leads/update',
    async ({ leadId, updateData }: { leadId: string; updateData: Partial<Lead> }, { rejectWithValue }) => {
        try {
            return await leadsService.updateLead(leadId, updateData);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to update lead');
        }
    }
);

export const addCallLog = createAsyncThunk(
    'leads/addCallLog',
    async ({ leadId, note, agent }: { leadId: string; note: string; agent?: string }, { rejectWithValue }) => {
        try {
            return await leadsService.addCallLog(leadId, note, agent);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to add call log');
        }
    }
);

export const updateCallLog = createAsyncThunk(
    'leads/updateCallLog',
    async ({ leadId, logId, note }: { leadId: string; logId: string; note: string }, { rejectWithValue }) => {
        try {
            return await leadsService.updateCallLog(leadId, logId, note);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to update call log');
        }
    }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const leadsSlice = createSlice({
    name: 'leads',
    initialState,
    reducers: {
        invalidateLeads: (state) => {
            state.status = 'idle';
        },
        upsertLead: (state, action: PayloadAction<Lead>) => {
            const idx = state.items.findIndex(
                (l) => (l._id || l.id) === (action.payload._id || action.payload.id)
            );
            if (idx !== -1) state.items[idx] = action.payload;
            else state.items.unshift(action.payload);
        },
    },
    extraReducers: (builder) => {
        // ── fetchLeads ─────────────────────────────────────────────────────
        const handleFetch = (state: LeadsState, action: any) => {
            state.status = 'succeeded';
            state.items = action.payload;
        };
        builder
            .addCase(fetchLeads.pending, (state) => { state.status = 'loading'; state.error = null; })
            .addCase(fetchLeads.fulfilled, handleFetch)
            .addCase(fetchLeads.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(forceFetchLeads.pending, (state) => { state.status = 'loading'; })
            .addCase(forceFetchLeads.fulfilled, handleFetch)
            .addCase(forceFetchLeads.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });

        // ── mutations ─────────────────────────────────────────────────────
        const upsertLeadInState = (state: LeadsState, action: PayloadAction<Lead>) => {
            const idx = state.items.findIndex(
                (l) => (l._id || l.id) === (action.payload._id || action.payload.id)
            );
            if (idx !== -1) state.items[idx] = action.payload;
        };

        builder
            .addCase(updateLead.fulfilled, upsertLeadInState)
            .addCase(addCallLog.fulfilled, upsertLeadInState)
            .addCase(updateCallLog.fulfilled, upsertLeadInState);
    },
});

export const { invalidateLeads, upsertLead } = leadsSlice.actions;
export default leadsSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────
type RootState = { leads: LeadsState };
export const selectLeads = (s: RootState) => s.leads.items;
export const selectLeadsStatus = (s: RootState) => s.leads.status;
export const selectLeadsLoading = (s: RootState) => s.leads.status === 'loading';
