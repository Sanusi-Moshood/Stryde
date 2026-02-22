import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#E8FF47',
        tabBarInactiveTintColor: '#555E7A',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <View style={[styles.icon, { backgroundColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name='challenges'
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color, size }) => (
            <View style={[styles.icon, { backgroundColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name='record'
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.recordButton}>
              <View style={styles.recordInner} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='crews'
        options={{
          title: 'Crews',
          tabBarIcon: ({ color, size }) => (
            <View style={[styles.icon, { backgroundColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <View style={[styles.icon, { backgroundColor: color }]} />
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
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#E8FF47',
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8FF47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  recordInner: {
    width: 24,
    height: 24,
    backgroundColor: '#080B14',
    borderRadius: 6,
  },
});
