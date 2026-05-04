import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import tenantReducer from './slices/tenantSlice';
import vehiclesReducer from './slices/vehiclesSlice';
import vehicleFormReducer from './slices/vehicleFormSlice';
import leadsReducer from './slices/leadsSlice';
import notificationsReducer from './slices/notificationsSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
    reducer: {
        tenant: tenantReducer,
        vehicles: vehiclesReducer,
        vehicleForm: vehicleFormReducer,
        leads: leadsReducer,
        notifications: notificationsReducer,
        analytics: analyticsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for non-serializable payloads (e.g., File objects)
                ignoredActions: ['vehicles/create', 'vehicles/update'],
            },
        }),
    devTools: import.meta.env.DEV,
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ─── Typed hooks (use these throughout the app instead of plain hooks) ────────
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
