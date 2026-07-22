import { Share } from 'react-native';
import { SHARE_URL } from '@/lib/config';

type ShareTarget =
  | { type: 'product'; id: string; title: string; price: string }
  | { type: 'profile'; id: string; name: string };

export function useShare() {
  const share = async (target: ShareTarget) => {
    try {
      if (target.type === 'product') {
        const url = `${SHARE_URL}/p/${target.id}`;
        await Share.share({
          title: target.title,
          message: `${target.title} — ${target.price}\n${url}`,
          url,
        });
      } else {
        const url = `${SHARE_URL}/u/${target.id}`;
        await Share.share({
          title: `${target.name} en Bomell`,
          message: `Mira el perfil de ${target.name} en Bomell\n${url}`,
          url,
        });
      }
    } catch {}
  };

  return { share };
}
