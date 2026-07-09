import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'market_viewer_key';

/**
 * Stable per-device id used to dedup product views server-side, so re-entering
 * a listing (or a Fast Refresh remount) doesn't inflate the view counter.
 */
export async function getViewerKey(): Promise<string> {
  let k = await AsyncStorage.getItem(KEY);
  if (!k) {
    k = `${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random()
      .toString(36)
      .slice(2)}`;
    await AsyncStorage.setItem(KEY, k);
  }
  return k;
}
