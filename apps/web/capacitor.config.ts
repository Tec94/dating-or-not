import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.datingornot.app',
  appName: 'Dating or Not',
  webDir: 'dist',
  server: {
    // For development - allows live reload from your dev server
    // Comment out for production builds
    ...(process.env.NODE_ENV !== 'production' && {
      url: 'http://localhost:5173',
      cleartext: true
    })
  },
  ios: {
    scheme: 'Dating or Not',
    contentInset: 'automatic',
    backgroundColor: '#1a1a1a', // Match your dark theme
    // Allow HTTP in development
    allowsLinkPreview: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Camera: {
      // For profile photos
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      // For dating proximity features
      permissions: ['location']
    },
    LiveUpdates: {
      // Enable live updates for over-the-air app updates
      appId: 'com.datingornot.app',
      channel: 'production'
    }
  }
};

export default config;
