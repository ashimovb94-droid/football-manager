import AsyncStorage from '@react-native-async-storage/async-storage';

// Глобальное хранилище в памяти
let _token = null;
let _user = null;

export const saveSession = async (token, user) => {
  _token = token;
  _user = user;
  try {
    await AsyncStorage.setItem('fm_token', token);
    await AsyncStorage.setItem('fm_user', JSON.stringify(user));
  } catch (e) {}
};

export const loadSession = async () => {
  if (_token) return { token: _token, user: _user };
  try {
    const token = await AsyncStorage.getItem('fm_token');
    const user = await AsyncStorage.getItem('fm_user');
    if (token) {
      _token = token;
      _user = user ? JSON.parse(user) : null;
    }
    return { token: _token, user: _user };
  } catch (e) {
    return { token: null, user: null };
  }
};

export const clearSession = async () => {
  _token = null;
  _user = null;
  try {
    await AsyncStorage.removeItem('fm_token');
    await AsyncStorage.removeItem('fm_user');
    await AsyncStorage.removeItem('club');
    await AsyncStorage.removeItem('managerName');
  } catch (e) {}
};
