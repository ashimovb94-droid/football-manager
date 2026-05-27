import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import RegisterScreen from './screens/RegisterScreen';
import ClubSelectScreen from './screens/ClubSelectScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Register">
        <Stack.Screen name="Register"   component={RegisterScreen} />
        <Stack.Screen name="ClubSelect" component={ClubSelectScreen} />
        <Stack.Screen name="Home"       component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
