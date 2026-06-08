import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Bell,
  Heart,
  ShoppingBag,
  Tag,
  MessageCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';

type NotifType = 'like' | 'sale' | 'price' | 'message' | 'verified';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  avatar?: string;
}

const INITIAL_NOTIFS: Notif[] = [
  {
    id: '1',
    type: 'message',
    title: 'Carlos E. te escribió',
    body: '¿Sigue disponible el iPhone 15 Pro?',
    time: 'Hace 5 min',
    read: false,
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '2',
    type: 'like',
    title: 'Tu producto gustó',
    body: 'A 3 personas les gustó tu anuncio "Reloj Minimal".',
    time: 'Hace 20 min',
    read: false,
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '3',
    type: 'price',
    title: 'Bajada de precio',
    body: 'El Sony Noise Cancelling que guardaste bajó a 99.000 XAF.',
    time: 'Hace 1 h',
    read: false,
  },
  {
    id: '4',
    type: 'sale',
    title: '¡Venta realizada!',
    body: 'Vendiste las "Nike Air Max 2024" por 65.000 XAF.',
    time: 'Hace 3 h',
    read: true,
  },
  {
    id: '5',
    type: 'verified',
    title: 'Cuenta verificada',
    body: 'Tu perfil de vendedor ha sido verificado con éxito.',
    time: 'Ayer',
    read: true,
  },
  {
    id: '6',
    type: 'message',
    title: 'Elena M. te escribió',
    body: 'Puedo pasar a recogerlo mañana por la mañana.',
    time: 'Ayer',
    read: true,
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=80',
  },
  {
    id: '7',
    type: 'price',
    title: 'Oferta especial',
    body: 'El Toyota Corolla 2018 que viste tiene una nueva oferta.',
    time: 'Hace 2 días',
    read: true,
  },
];

const ICON_MAP: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  message: { icon: MessageCircle, bg: colors.secondary + '18', color: colors.secondary },
  like:    { icon: Heart,         bg: colors.error + '15',    color: colors.error },
  price:   { icon: Tag,           bg: colors.tertiary + '15', color: colors.tertiary },
  sale:    { icon: ShoppingBag,   bg: colors.primary + '15',  color: colors.primary },
  verified:{ icon: CheckCircle,   bg: colors.primary + '15',  color: colors.primary },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifs((prev) => prev.filter((n) => n.id !== id));
  const markRead = (id: string) =>
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  if (!mounted && !visible) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX }],
          },
        ]}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={colors.onSurfaceVariant} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <Text style={styles.panelTitle}>Notificaciones</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Leer todo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.markAllBtn} />
          )}
        </View>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 8 }}>
          {notifs.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Bell size={36} color={colors.primary + '66'} strokeWidth={1} />
              </View>
              <Text style={styles.emptyTitle}>Todo al día</Text>
              <Text style={styles.emptyDesc}>No tienes notificaciones pendientes.</Text>
            </View>
          ) : (
            notifs.map((notif) => {
              const { icon: Icon, bg, color } = ICON_MAP[notif.type];
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.item, !notif.read && styles.itemUnread]}
                  activeOpacity={0.85}
                  onPress={() => markRead(notif.id)}>
                  <View style={styles.itemLeft}>
                    {notif.avatar ? (
                      <View style={styles.avatarWrap}>
                        <Image source={{ uri: notif.avatar }} style={styles.avatar} />
                        <View style={[styles.avatarBadge, { backgroundColor: bg }]}>
                          <Icon size={10} color={color} strokeWidth={2} />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                        <Icon size={20} color={color} strokeWidth={1.5} />
                      </View>
                    )}
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={[styles.itemTitle, !notif.read && styles.itemTitleUnread]}>
                      {notif.title}
                    </Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{notif.body}</Text>
                    <Text style={styles.itemTime}>{notif.time}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    {!notif.read && <View style={styles.unreadDot} />}
                    <TouchableOpacity
                      style={styles.dismissBtn}
                      onPress={() => dismiss(notif.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Trash2 size={16} color={colors.onSurfaceVariant + '66'} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '44',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: '#ffffff',
  },
  markAllBtn: {
    width: 70,
    alignItems: 'flex-end',
    paddingVertical: 4,
  },
  markAllText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: colors.secondary,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '22',
  },
  itemUnread: {
    backgroundColor: colors.primary + '07',
  },
  itemLeft: {
    paddingTop: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: colors.outlineVariant + '44',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 19,
  },
  itemTitleUnread: {
    fontFamily: 'Manrope-SemiBold',
  },
  itemDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  itemTime: {
    fontFamily: 'Manrope-Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant + '88',
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  dismissBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    color: colors.onSurface,
  },
  emptyDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
