import type { CapacitorConfig } from '@capacitor/cli';

const isProd = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'com.datingornot.app',
  appName: 'Dating or Not',
  webDir: 'dist',
  server: {
    // Use dev server only during development; Capacitor serves local files in production
    iosScheme: 'capacitor',
    ...(isProd ? {} : { url: 'http://localhost:5173', cleartext: true })
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a1a',
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
    LiveUpdates: {
      appId: 'b2c542a8',
      channel: 'production'
    }
  }
};

export default config;
