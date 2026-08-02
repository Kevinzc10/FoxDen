import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  size?: number;
  animated?: boolean;
}

export function FoxCompanion({ size = 120, animated = true }: Props) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2500 }),
        withTiming(0.97, { duration: 2500 })
      ),
      -1,
      true
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2000 }),
        withTiming(4, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [animated, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      <Image
        source={require('@/assets/images/fox-companion.png')}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
