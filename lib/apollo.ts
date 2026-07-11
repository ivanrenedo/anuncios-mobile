import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GRAPHQL_URL } from './config';

const TOKEN_KEY = 'market_eg_token';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

const httpLink = createHttpLink({ uri: GRAPHQL_URL });

const authLink = setContext(async (_, { headers }) => {
  const token = await getToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

let suspendedAlertShown = false;
let _onSuspended: (() => void) | null = null;

/** Register a callback invoked when any query returns "account suspended". */
export function onAccountSuspended(handler: () => void) {
  _onSuspended = handler;
}

/** Re-arm the one-shot suspension alert (call after a successful login). */
export function resetSuspendedAlert() {
  suspendedAlertShown = false;
}

const errorLink = onError(({ error }) => {
  if (!CombinedGraphQLErrors.is(error)) return;

  const msgs = error.errors.map((e) => e.message.toLowerCase());
  const suspended = msgs.some(
    (m) => m.includes('suspendida') || m.includes('suspended'),
  );
  if (suspended && !suspendedAlertShown) {
    suspendedAlertShown = true;
    Alert.alert(
      'Cuenta suspendida',
      'Tu cuenta ha sido suspendida. Si crees que es un error, contacta con soporte.',
    );
    if (_onSuspended) {
      _onSuspended();
    } else {
      removeToken();
      AsyncStorage.removeItem('market_eg_auth_v1');
      AsyncStorage.removeItem('market_eg_refresh_token');
      apolloClient.clearStore().catch(() => {});
    }
  }
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: { merge: false },
          productsByCategory: { merge: false },
          productsBySeller: { merge: false },
          searchProducts: { merge: false },
          sectionProducts: { merge: false },
          homeSections: { merge: false },
          myFavorites: { merge: false },
          notifications: { merge: false },
          reviewsBySeller: { merge: false },
          followers: { merge: false },
          following: { merge: false },
          mySavedSearches: { merge: false },
          myViewsDaily: { merge: false },
        },
      },
      ProductModel: {
        fields: {
          images: { merge: false },
          vehicleDetail: { merge: false },
          propertyDetail: { merge: false },
          serviceDetail: { merge: false },
          jobDetail: { merge: false },
        },
      },
    },
  }),
  defaultOptions: {
    // errorPolicy 'all': a failed watched query (e.g. an in-flight request
    // resolving with UNAUTHENTICATED right after logout) surfaces through the
    // hook's `error` field instead of throwing an uncaught CombinedGraphQLErrors,
    // and Apollo skips the cache write for error results (no "missing field"
    // warnings from writing null data). Direct client.query()/mutate() calls
    // keep the default 'none' policy so existing try/catch flows still work.
    // The `as any` cast avoids Apollo 4's DeclareDefaultOptions TS ceremony,
    // whose module augmentation conflicts with our untyped useQuery<any> calls.
    watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' as any },
    query: { fetchPolicy: 'network-only' },
  },
});
