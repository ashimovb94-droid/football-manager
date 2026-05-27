import { View } from 'react-native';
import Svg, { Path, Ellipse, Rect } from 'react-native-svg';

export default function JerseyIcon({ primary = '#333', secondary = '#fff', size = 60 }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 120">
        {/* Левый рукав */}
        <Path d="M5 22 L18 15 L28 35 L15 42 Z" fill={secondary} />
        {/* Правый рукав */}
        <Path d="M95 22 L82 15 L72 35 L85 42 Z" fill={secondary} />
        {/* Тело */}
        <Path d="M18 15 L28 35 L22 115 L78 115 L72 35 L82 15 L65 10 Q50 18 35 10 Z" fill={primary} />
        {/* Воротник */}
        <Ellipse cx="50" cy="13" rx="15" ry="7" fill={secondary} />
        <Ellipse cx="50" cy="14" rx="11" ry="5" fill={primary} />
        {/* Вертикальная полоска */}
        <Rect x="44" y="18" width="12" height="50" fill={secondary} opacity="0.2" />
      </Svg>
    </View>
  );
}
