import { UPLOAD_URL } from './config';
import { getToken } from './apollo';

export async function uploadImage(uri: string): Promise<string> {
  const token = await getToken();
  const name = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(name);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const form = new FormData();
  form.append('file', { uri, name, type } as any);

  const res = await fetch(`${UPLOAD_URL}/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const data = await res.json();
  return data.url;
}

export async function uploadImages(uris: string[]): Promise<string[]> {
  const token = await getToken();
  const form = new FormData();

  uris.forEach((uri) => {
    const name = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    form.append('files', { uri, name, type } as any);
  });

  const res = await fetch(`${UPLOAD_URL}/images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const data = await res.json();
  return data.urls;
}
