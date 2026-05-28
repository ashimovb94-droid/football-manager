import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveSession = async (token, user) => {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const loadSession = async () => {
  const token = await AsyncStorage.getItem('token');
  const user = await AsyncStorage.getItem('user');
  return { token, user: user ? JSON.parse(user) : null };
};

export const clearSession = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('club');
  await AsyncStorage.removeItem('managerName');
};

export const saveManagerData = async (club, managerName) => {
  await AsyncStorage.setItem('club', JSON.stringify(club));
  await AsyncStorage.setItem('managerName', managerName);
};

export const loadManagerData = async () => {
  const club = await AsyncStorage.getItem('club');
  const managerName = await AsyncStorage.getItem('managerName');
  return {
    club: club ? JSON.parse(club) : null,
    managerName: managerName || null,
  };
};
