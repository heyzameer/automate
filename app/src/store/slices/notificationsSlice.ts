import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { notificationsService, AppNotification } from '../../services/notifications.service';

// ─── State ────────────────────────────────────────────────────────────────────
interface NotificationsState {
    items: AppNotification[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: NotificationsState = {
    items: [],
    status: 'idle',
    error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            return await notificationsService.getNotifications();
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch notifications');
        }
    },
    {
        // Skip if already loaded or in flight — eliminates the duplicate XHR
        condition: (_, { getState }) => {
            const { notifications } = getState() as { notifications: NotificationsState };
            return notifications.status !== 'loading' && notifications.status !== 'succeeded';
        },
    }
);

export const markNotificationRead = createAsyncThunk(
    'notifications/markRead',
    async (id: string, { rejectWithValue }) => {
        try {
            await notificationsService.markAsRead(id);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to mark as read');
        }
    }
);

export const markAllNotificationsRead = createAsyncThunk(
    'notifications/markAllRead',
    async (_, { getState, rejectWithValue }) => {
        const { notifications } = getState() as { notifications: NotificationsState };
        const unreadIds = notifications.items.filter(n => !n.isRead).map(n => n._id);
        if (unreadIds.length === 0) return [];
        try {
            await Promise.all(unreadIds.map(id => notificationsService.markAsRead(id)));
            return unreadIds;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message ?? 'Failed to mark all as read');
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        // Push a real-time notification from socket without a re-fetch
        prependNotification: (state, action: PayloadAction<AppNotification>) => {
            const exists = state.items.some(n => n._id === action.payload._id);
            if (!exists) state.items.unshift(action.payload);
        },
        invalidateNotifications: (state) => {
            state.status = 'idle';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })

            // Mark single as read — optimistic update
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                const n = state.items.find(n => n._id === action.payload);
                if (n) n.isRead = true;
            })

            // Mark all as read
            .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
                const ids = new Set(action.payload as string[]);
                state.items.forEach(n => { if (ids.has(n._id)) n.isRead = true; });
            });
    },
});

export const { prependNotification, invalidateNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
type RootState = { notifications: NotificationsState };
export const selectNotifications    = (s: RootState) => s.notifications.items;
export const selectNotificationsStatus = (s: RootState) => s.notifications.status;
export const selectUnreadCount      = (s: RootState) => s.notifications.items.filter(n => !n.isRead).length;
export const selectNotificationsLoading = (s: RootState) => s.notifications.status === 'loading';
