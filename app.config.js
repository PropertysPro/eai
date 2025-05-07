export default {
  expo: {
    name: 'Elme AI',
    slug: 'elme-ai',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.elmeai.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.elmeai.app"
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: "2ff564da-c490-406c-9765-6deaf5e2c6f7"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gjymtvzdvyekhocqyvpa.supabase.co',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeW10dnpkdnlla2hvY3F5dnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTU3NDUsImV4cCI6MjA2MTI3MTc0NX0.ts-OO-Djf5go35GqoFzAKvxjdZbIJQQegPJkkqgLeOY'
    }
  }
};
