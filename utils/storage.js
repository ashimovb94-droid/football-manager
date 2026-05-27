import AsyncStorage from '@react-native-async-storage/async-storage';

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
