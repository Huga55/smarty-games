import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ru.smarty.igraem',
  appName: 'Играем!',
  webDir: 'dist',
  backgroundColor: '#17123a',
  android: {
    // Всё содержимое лежит внутри приложения, никаких сетевых запросов.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
}

export default config
