import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from './useAuth';
import { GET_NOTIFICATIONS, UNREAD_COUNT } from '@/graphql/queries';
import {
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  DELETE_NOTIFICATION,
} from '@/graphql/mutations';

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useQuery<any>(GET_NOTIFICATIONS, {
    skip: !isAuthenticated,
  });
  return { notifications: data?.notifications ?? [], loading, error, refetch };
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  const { data, loading, refetch } = useQuery<any>(UNREAD_COUNT, {
    skip: !isAuthenticated,
  });
  return { count: data?.unreadNotificationsCount ?? 0, loading, refetch };
}

export function useMarkNotificationRead() {
  const [mutate] = useMutation(MARK_NOTIFICATION_READ, {
    refetchQueries: [{ query: GET_NOTIFICATIONS }, { query: UNREAD_COUNT }],
  });
  const markRead = (id: string) => mutate({ variables: { id } });
  return { markRead };
}

export function useMarkAllRead() {
  const [mutate, { loading }] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    refetchQueries: [{ query: GET_NOTIFICATIONS }, { query: UNREAD_COUNT }],
  });
  return { markAllRead: () => mutate(), loading };
}

export function useDeleteNotification() {
  const [mutate] = useMutation(DELETE_NOTIFICATION, {
    refetchQueries: [{ query: GET_NOTIFICATIONS }, { query: UNREAD_COUNT }],
  });
  const remove = (id: string) => mutate({ variables: { id } });
  return { remove };
}
