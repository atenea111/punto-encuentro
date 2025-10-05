import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.puntoencuentro.app',
  appName: 'Punto Encuentro',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
