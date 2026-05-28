import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveSession = async (token, user) => {
  await AsyncStorage.setItem('fm_token', token);
  await AsyncStorage.setItem('fm_user', JSON.stringify(user));
};

export const loadSession = async () => {
  const token = await AsyncStorage.getItem('fm_token');
  const user = await AsyncStorage.getItem('fm_user');
  return { token, user: user ? JSON.parse(user) : null };
};

export const clearSession = async () => {
  await AsyncStorage.multiRemove(['fm_token', 'fm_user', 'fm_club', 'fm_manager']);
};

export const saveManagerData = async (club, managerName) => {
  await AsyncStorage.setItem('fm_club', JSON.stringify(club));
  await AsyncStorage.setItem('fm_manager', managerName || '');
};

export const loadManagerData = async () => {
  const club = await AsyncStorage.getItem('fm_club');
  const managerName = await AsyncStorage.getItem('fm_manager');
  return {
    club: club ? JSON.parse(club) : null,
    managerName: managerName || null,
  };
};
