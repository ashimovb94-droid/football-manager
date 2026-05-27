import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './screens/SplashScreen';
import AuthScreen from './screens/AuthScreen';
import ClubSelectScreen from './screens/ClubSelectScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash"     component={SplashScreen} />
        <Stack.Screen name="Auth"       component={AuthScreen} />
        <Stack.Screen name="ClubSelect" component={ClubSelectScreen} />
        <Stack.Screen name="Home"       component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
