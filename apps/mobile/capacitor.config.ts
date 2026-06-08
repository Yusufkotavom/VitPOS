import type { CapacitorConfig } from '@capacitor/cli';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: CapacitorConfig = {
  appId: 'com.kotacom.vitpos',
  appName: 'VitPOS',
  // Point to root web build
  webDir: resolve(__dirname, '../../dist'),
  server: {
    androidScheme: 'https'
  }
};

export default config;
