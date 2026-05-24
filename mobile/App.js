import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, ImageBackground } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from './src/store';
import LoginScreen from './src/screens/LoginScreen';
import ClubSelectScreen from './src/screens/ClubSelectScreen';
import HomeScreen from './src/screens/HomeScreen';
import SquadScreen from './src/screens/SquadScreen';
import TacticsScreen from './src/screens/TacticsScreen';
import StandingsScreen from './src/screens/StandingsScreen';
import FixturesScreen from './src/screens/FixturesScreen';
import MatchScreen from './src/screens/MatchScreen';
import CupScreen from './src/screens/CupScreen';
import TransfersScreen from './src/screens/TransfersScreen';
import PlayerOfferScreen from './src/screens/PlayerOfferScreen';
import ScoutsScreen from './src/screens/ScoutsScreen';
import OfferDetailScreen from './src/screens/OfferDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const BG_IMG = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=60';
const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

// Собираем нижний таббар для основных экранов
function MainTabs() {
  return (
    <Tab.Navigator
      // ВОТ ЭТА СТРОЧКА ВЕРНЕТ ФОН СТАДИОНА НА ВСЕ ЭКРАНЫ
      sceneContainerStyle={{ backgroundColor: 'transparent' }} 
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: 'rgba(13,17,23,0.98)' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', letterSpacing: 1, fontSize: 13 },
        tabBarStyle: {
          backgroundColor: '#0d1117',
          borderTopColor: 'rgba(255,255,255,0.06)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#4fc3f7',
        tabBarInactiveTintColor: '#7a8a9e',
        
        // Уменьшили шрифт до 9 и чуть сжали, чтобы длинные слова влезли
        tabBarLabelStyle: { fontSize: 9, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
        
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Squad') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Tactics') iconName = focused ? 'football' : 'football-outline';
          else if (route.name === 'Transfers') iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          else if (route.name === 'Fixtures') iconName = focused ? 'calendar' : 'calendar-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ title: 'ГЛАВНАЯ', headerShown: false }} />
      <Tab.Screen name="Squad"     component={SquadScreen}     options={{ title: 'СОСТАВ' }} />
      <Tab.Screen name="Tactics"   component={TacticsScreen}   options={{ title: 'ТАКТИКА' }} />
      <Tab.Screen name="Transfers" component={TransfersScreen} options={{ title: 'ТРАНСФЕРЫ' }} />
      <Tab.Screen name="Fixtures"  component={FixturesScreen}  options={{ title: 'КАЛЕНДАРЬ' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { token, user, isLoading, init } = useAuthStore();

  useEffect(() => { init(); }, []);

  if (isLoading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color="#4fc3f7" />
      </View>
    );
  }

  const hasClub = user?.manager?.clubId != null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ImageBackground source={{ uri: BG_IMG }} style={s.root} imageStyle={s.bgImage}>
        <View style={s.overlay} />
        <NavigationContainer theme={TransparentTheme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: 'rgba(13,17,23,0.98)' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
              headerTitleStyle: { fontWeight: '700', letterSpacing: 1, fontSize: 13 },
              contentStyle: { backgroundColor: 'transparent' }, // Это тоже должно быть тут
              animation: 'slide_from_right',
            }}
          >
            {!token ? (
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            ) : !hasClub ? (
              <Stack.Screen name="ClubSelect" component={ClubSelectScreen} options={{ title: 'ВЫБОР КЛУБА' }} />
            ) : (
              <>
                {/* Корневой экран теперь — это наши табы */}
                <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

                {/* Все остальные экраны открываются ПОВЕРХ табов */}
                <Stack.Screen name="Standings"   component={StandingsScreen}   options={{ title: 'ТАБЛИЦА ЛИГИ' }} />
                <Stack.Screen name="Cup"         component={CupScreen}         options={{ title: 'КУБОК АНГЛИИ' }} />
                <Stack.Screen name="Match"       component={MatchScreen}       options={{ title: 'МАТЧ' }} />
                <Stack.Screen name="PlayerOffer" component={PlayerOfferScreen} options={{ title: 'ИГРОК' }} />
                <Stack.Screen name="Scouts"      component={ScoutsScreen}      options={{ title: 'СКАУТЫ' }} />
                <Stack.Screen name="OfferDetail" component={OfferDetailScreen} options={{ title: 'ДЕТАЛИ ОФЕРТЫ' }} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ImageBackground>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  bgImage: { opacity: 0.07 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0d1117' },
  loader:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1117' },
});

