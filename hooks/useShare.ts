import { Share } from 'react-native';
import { SHARE_URL } from '@/lib/config';

type ShareTarget =
  | { type: 'product'; id: string; title: string; price: string }
  | { type: 'profile'; id: string; name: string };

/**
 * All share links point at the public web domain so that a single URL works
 * everywhere: desktop browsers land on the Next.js page, and phones with the
 * app installed open it directly via Android App Links / iOS Universal Links
 * (declared in app.json + verified with .well-known files hosted by the web).
 */
export function useShare() {
  const share = async (target: ShareTarget) => {
    try {
      if (target.type === 'product') {
        const url = `${SHARE_URL}/product/${target.id}`;
        await Share.share({
          title: target.title,
          message: `${target.title} — ${target.price}\n${url}`,
          url,
        });
      } else {
        const url = `${SHARE_URL}/user/${target.id}`;
        await Share.share({
          title: `${target.name} en Bomelh`,
          message: `Mira el perfil de ${target.name} en Bomelh\n${url}`,
          url,
        });
      }
    } catch {}
  };

  return { share };
}
