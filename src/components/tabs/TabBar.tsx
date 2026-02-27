import {
  View,
  Platform,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import HomeIcon from '@/assets/icons/home.svg';
import FeedIcon from '@/assets/icons/feed.svg';
import UserIcon from '@/assets/icons/user.svg';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from '../Text';
import { JSX, useEffect, useRef, useState } from 'react';
import TabbarButton from './TabbarButton';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();

  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>(
    [],
  );
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  const icon: Record<string, (props: any) => JSX.Element> = {
    home: (props) => <HomeIcon width={18} height={18} {...props} />,
    profile: (props) => <UserIcon width={18} height={18} {...props} />,
    feed: (props) => <FeedIcon width={18} height={18} {...props} />,
  };
  const isFirstRender = useRef(true);

  // Animate indicator when active tab changes
  useEffect(() => {
    if (tabLayouts.length > state.index) {
      const { x, width } = tabLayouts[state.index];

      if (isFirstRender.current) {
        // No animation on first render, just snap into place
        translateX.setValue(x);
        indicatorWidth.setValue(x);
        isFirstRender.current = false;
      } else {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: x,
            useNativeDriver: false,
            damping: 20,
            stiffness: 200,
            mass: 0.8,
          }),
          Animated.spring(indicatorWidth, {
            toValue: width,
            useNativeDriver: false,
            damping: 20,
            stiffness: 200,
            mass: 0.8,
          }),
        ]).start();
      }
    }
  }, [state.index, tabLayouts]);

  const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const updated = [...prev];
      updated[index] = { x, width };
      return updated;
    });
  };

  return (
    <BlurView
      intensity={95}
      tint='dark'
      style={[styles.tabBar, { bottom: insets.bottom }]}
    >
      {/* Animated sliding indicator */}
      {tabLayouts.length === state.routes.length && (
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX }],
              width: indicatorWidth,
            },
          ]}
        />
      )}

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabbarButton
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            label={label as string}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onLayout={(e: LayoutChangeEvent) => handleTabLayout(index, e)}
          />
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    backgroundColor: 'rgba(145, 145, 145, 0.16)',
    borderColor: '#1F1F1F',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 100,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    backgroundColor: '#000000',
    borderRadius: 100,
  },
});
