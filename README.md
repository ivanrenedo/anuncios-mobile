# Bomelh Mobile

App mobile de Bomelh con Expo Router y React Native.

## Requisitos

- Node 22
- Expo/EAS CLI para builds
- Backend disponible en `EXPO_PUBLIC_API_URL`

`.env` minimo:

```env
EXPO_PUBLIC_API_URL=https://api.bomelh.com
EXPO_PUBLIC_SHARE_URL=https://bomelh.com
```

Para desarrollo en dispositivo fisico, usa la IP LAN del PC:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.101:3000
```

## Desarrollo

```bash
npm ci
npx expo start
```

## Verificacion

```bash
npm run typecheck
```

## Build

Preview para testers:

```bash
eas build --profile preview --platform android
```

Produccion:

```bash
eas build --profile production --platform all
```

## Areas Principales

- `app`: rutas Expo Router.
- `components`: UI mobile.
- `hooks`: llamadas GraphQL y estado de pantalla.
- `graphql`: queries/mutations compartidas con backend.
- `lib/config.ts`: URLs de API, uploads y share.

Ver `../docs/RELEASE_CHECKLIST.md` antes de publicar.
