import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Stryde",
  slug: "Stryde",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/splash.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  scheme: "stryde",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "cover",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.stryde.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/splash.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.stryde.app",
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
      "android.permission.WAKE_LOCK",
    ],
    config: {
      googleMaps: {
        apiKey: process.env.MAP_API_KEY,
      },
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow Stryde to track your runs.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
  ],
};

export default config;
