import React, { JSX, useEffect } from 'react';
import { StyleSheet, LayoutChangeEvent } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import { Text } from '../Text';
import HomeIcon from '@/assets/icons/home.svg';
import FeedIcon from '@/assets/icons/feed.svg';
import UserIcon from '@/assets/icons/user.svg';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
const icon: Record<string, (props: any) => JSX.Element> = {
  home: (props) => <HomeIcon width={18} height={18} {...props} />,
  profile: (props) => <UserIcon width={18} height={18} {...props} />,
  feed: (props) => <FeedIcon width={18} height={18} {...props} />,
};

export default function TabbarButton({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  label,
  href,
  accessibilityLabel,
  testID,
  onLayout,
}: {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  label: string;
  href?: string;
  accessibilityLabel?: string;
  testID?: string;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) }),
      );
    }
  }, [isFocused]);
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <PlatformPressable
      href={href}
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={onLayout}
      style={[styles.tabBarItem]}
    >
      <Animated.View style={animatedIconStyle}>
        {icon[routeName]({
          color: isFocused ? '#FFFFFF' : '#808080',
        })}
      </Animated.View>
      <Text
        style={{
          color: isFocused ? '#FFFFFF' : '#808080',
          fontWeight: 500,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 100,
  },
});
