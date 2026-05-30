import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SplashScreen from './screens/SplashScreen';
import AuthScreen from './screens/AuthScreen';
import ClubSelectScreen from './screens/ClubSelectScreen';
import HomeScreen from './screens/HomeScreen';
import SquadScreen from './screens/SquadScreen';
import SeasonScreen from './screens/SeasonScreen';
import TransferScreen from './screens/TransferScreen';
import TacticsScreen from './screens/TacticsScreen';
import MatchScreen from './screens/MatchScreen';
import PreseasonScreen from './screens/PreseasonScreen';
import ManagerProfileScreen from './screens/ManagerProfileScreen';
import CupScreen from './screens/CupScreen';
import TrainingScreen from './screens/TrainingScreen';
import SeasonResultScreen from './screens/SeasonResultScreen';
import CupResultScreen from './screens/CupResultScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#12121a',
          borderTopColor: '#ffffff15',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#00d4ff',
        tabBarInactiveTintColor: '#8888aa',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
        tabBarIcon: ({ color, focused }) => {
          const icons = {
            Club:      focused ? 'home'            : 'home-outline',
            Squad:     focused ? 'people'          : 'people-outline',
            Cup:       focused ? 'trophy'          : 'trophy-outline',
            Season:    focused ? 'calendar'        : 'calendar-outline',
            Transfers: focused ? 'swap-horizontal' : 'swap-horizontal-outline',
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
        tabBarLabel: ({ color }) => {
          const { Text } = require('react-native');
          const labels = {
            Club: 'КЛУБ', Squad: 'СОСТАВ',
            Cup: 'КУБОК', Season: 'СЕЗОН', Transfers: 'ТРАНСФЕРЫ'
          };
          return <Text style={{ color, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>{labels[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Club"      component={HomeScreen} />
      <Tab.Screen name="Squad"     component={SquadScreen} />
      <Tab.Screen name="Cup"       component={CupScreen} />
      <Tab.Screen name="Season"    component={SeasonScreen} />
      <Tab.Screen name="Transfers" component={TransferScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash"         component={SplashScreen} />
        <Stack.Screen name="Auth"           component={AuthScreen} />
        <Stack.Screen name="ClubSelect"     component={ClubSelectScreen} />
        <Stack.Screen name="Main"           component={MainTabs} />
        <Stack.Screen name="Match"          component={MatchScreen} />
        <Stack.Screen name="Preseason"      component={PreseasonScreen} />
        <Stack.Screen name="ManagerProfile" component={ManagerProfileScreen} />
        <Stack.Screen name="Training"       component={TrainingScreen} />
        <Stack.Screen name="SeasonResult"   component={SeasonResultScreen} />
        <Stack.Screen name="CupResult"      component={CupResultScreen} />
        <Stack.Screen name="Tactics"        component={TacticsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
