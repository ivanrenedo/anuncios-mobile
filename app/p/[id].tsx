import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Short share-link route: `SHARE_URL/p/<id>` and `bomell://p/<id>` land here
 * and bounce straight to the product screen. Keeping the path identical to the
 * web share URL means Android App Links / iOS Universal Links resolve without
 * any extra mapping once the domain is verified.
 */
export default function ShareLinkRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!id) return <Redirect href={'/(tabs)' as any} />;
  return <Redirect href={{ pathname: '/product/[id]', params: { id } }} />;
}
