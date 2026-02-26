import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import HomeIcon from '@/assets/icons/home.svg';
import FeedIcon from '@/assets/icons/feed.svg';
import UserIcon from '@/assets/icons/user.svg';
import { TabBar } from '@/src/components/tabs/TabBar';
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name='feed'
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <View>
              <FeedIcon width={18} height={18} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='home'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <View>
              <HomeIcon width={18} height={18} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <View style={[styles.icon]}>
              <UserIcon width={18} height={18} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0E1220',
    borderTopWidth: 1,
    borderTopColor: '#252D45',
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontFamily: 'Archivo_500Medium',
    marginTop: 4,
  },
  tabBarItem: {
    paddingVertical: 8,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});
