import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from './api';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  init: async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);
      if (token) {
        // Всегда берём свежие данные с сервера
        try {
          const { api } = require('./api');
          const { data } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          await AsyncStorage.setItem('user', JSON.stringify(data));
          set({ token, user: data, isLoading: false });
        } catch {
          // Сервер недоступен — используем кэш
          set({ token, user: userJson ? JSON.parse(userJson) : null, isLoading: false });
        }
      } else {
        set({ token: null, user: null, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setAuth: async (token, user) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  // Обновить только user (после выбора клуба, изменения профиля)
  setUser: async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    set({ token: null, user: null });
  },
}));

// Регистрируем хендлер 401 → сразу разлогин
setUnauthorizedHandler(async () => {
  await useAuthStore.getState().logout();
});
