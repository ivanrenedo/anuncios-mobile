import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Short share-link route: `SHARE_URL/u/<id>` and `bomelh://u/<id>` land here
 * and bounce straight to the user screen. Keeping the path identical to the
 * web share URL means Android App Links / iOS Universal Links resolve without
 * any extra mapping once the domain is verified.
 */
export default function ShareLinkRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!id) return <Redirect href={'/(tabs)' as any} />;
  return <Redirect href={{ pathname: '/user/[id]', params: { id } }} />;
}
