import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.r1plus.app',
  appName: 'r1plus',
  webDir: 'public',
  server: {
    url: 'https://r1plus.vercel.app',
    cleartext: true
  }
};

export default config;