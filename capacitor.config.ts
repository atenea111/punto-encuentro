import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.encuentro12',
  appName: 'Punto Encuentro',
  webDir: 'out',
  android: {
    adjustMarginsForEdgeToEdge: 'force'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      // El teclado no debe achicar el WebView: eso aplasta Inicio, Agenda, etc.
      // Los overlays (Punto y chat) se recuestan con useVisibleViewport.
      resize: KeyboardResize.None,
      resizeOnFullScreen: false,
    }
  },
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
