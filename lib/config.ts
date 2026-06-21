import { Platform } from 'react-native';

// 10.0.2.2 is the Android *emulator* alias for the host's localhost; it is
// unreachable from a physical device. When testing on a real phone, set
// EXPO_PUBLIC_API_URL to your computer's LAN IP, e.g. http://192.168.1.50:3000
// (phone + PC on the same Wi-Fi, backend listening on 0.0.0.0).
const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL!;
export const GRAPHQL_URL = `${API_URL}/graphql`;
export const UPLOAD_URL = `${API_URL}/upload`;
