import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://78.24.220.105:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// При 401 — токен невалиден, чистим storage
// Слушателя на стор привяжем в store.js, чтобы избежать циклического импорта
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && onUnauthorized) {
      await onUnauthorized();
    }
    return Promise.reject(err);
  }
);
