import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistCache, AsyncStorageWrapper, CachePersistor } from 'apollo3-cache-persist';
import { GRAPHQL_URL } from './config';

const TOKEN_KEY = 'market_eg_token';
const APOLLO_CACHE_KEY = 'apollo-cache-persist';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// Plain HttpLink — Apollo Server v5 (@apollo/server ^5) that the backend runs
// rejects batched POST arrays unless `allowBatchedHttpRequests: true` is set
// on the driver config. Until the backend is deployed with that flag, keep
// one request per query. To switch back to batching:
//   1. In backend/src/app.module.ts inside GraphQLModule.forRootAsync
//      useFactory return object, add: allowBatchedHttpRequests: true
//   2. Deploy the backend.
//   3. Swap this createHttpLink for BatchHttpLink from
//      '@apollo/client/link/batch-http' (batchMax:10, batchInterval:20).
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

const cache = new InMemoryCache({
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
        myAutoBumpSlots: { merge: false },
        pinnedProducts: { merge: false },
        homeCarouselPremium: { merge: false },
        categoryTree: { merge: false },
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
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache,
  defaultOptions: {
    // `cache-first` is the fast default: hooks read from the persisted cache
    // instantly. Screens whose data must always be fresh (notifications, home
    // feed, product lists) opt into `cache-and-network` explicitly in their hook.
    // errorPolicy 'all': in-flight queries that resolve with UNAUTHENTICATED
    // right after logout surface via the hook's `error` field instead of
    // throwing, and Apollo skips writing null data into the cache.
    watchQuery: { fetchPolicy: 'cache-first', errorPolicy: 'all' as any },
    query: { fetchPolicy: 'cache-first' },
  },
});

/**
 * Restore the Apollo cache from AsyncStorage before rendering the app so
 * screens that were previously visited paint instantly on cold start.
 * Idempotent — subsequent calls return the same promise.
 */
let hydrationPromise: Promise<void> | null = null;
let cachePersistor: CachePersistor<any> | null = null;

export function hydrateApolloCache(): Promise<void> {
  if (!hydrationPromise) {
    cachePersistor = new CachePersistor({
      cache,
      storage: new AsyncStorageWrapper(AsyncStorage),
      key: APOLLO_CACHE_KEY,
      maxSize: 5 * 1024 * 1024,
      debug: false,
    });
    hydrationPromise = cachePersistor.restore();
  }
  return hydrationPromise;
}

/**
 * Wipe both the in-memory Apollo cache and the persisted copy in AsyncStorage.
 * Call on logout — otherwise the next cold start rehydrates the previous
 * user's data and the app renders it before the fresh session lands.
 */
export async function purgeApolloCache(): Promise<void> {
  try {
    if (cachePersistor) await cachePersistor.purge();
  } catch {
    // Fallback: nuke the key directly so we never leave stale data behind.
    await AsyncStorage.removeItem(APOLLO_CACHE_KEY).catch(() => {});
  }
  await apolloClient.clearStore().catch(() => {});
}
