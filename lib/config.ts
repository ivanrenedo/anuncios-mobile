import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const API_URL = DEV_API_URL!;
export const GRAPHQL_URL = `${API_URL}/graphql`;
export const UPLOAD_URL = `${API_URL}/upload`;
