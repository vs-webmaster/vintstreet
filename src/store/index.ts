import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import sellerProfileReducer from './slices/sellerProfileSlice';

const sellerProfilePersistConfig = {
  key: 'sellerProfile',
  storage,
};

const persistedSellerProfileReducer = persistReducer(sellerProfilePersistConfig, sellerProfileReducer);

export const store = configureStore({
  reducer: {
    sellerProfile: persistedSellerProfileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
