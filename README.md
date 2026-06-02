# Stratega Planner

Aplicacion de planificacion estrategica y gestion para community managers, creadores y equipos de marketing.

Construida con React, Vite, Firebase y Capacitor para web, Android e iOS.

## Stack

- Frontend: React 19, Vite, Tailwind CSS
- Routing: React Router 7
- Backend: Firebase Auth, Firestore, Storage, Cloud Functions y FCM
- Mobile: Capacitor Android/iOS
- IA: Groq via Cloud Function `groqProxy`
- i18n: i18next
- Suscripciones: Paddle Billing v2

## Requisitos

- Node.js 22 recomendado para Cloud Functions
- npm
- Android Studio para Android
- Xcode en macOS para iOS
- Firebase CLI para reglas, hosting y functions

## Instalacion

```bash
npm install
cd functions && npm install
```

Crea `.env` en la raiz usando `.env.example` como base.

## Variables de entorno web

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
```

## Secrets de Functions

```bash
firebase functions:secrets:set PAYPAL_CLIENT_ID
firebase functions:secrets:set PAYPAL_SECRET
firebase functions:secrets:set PADDLE_API_KEY
firebase functions:secrets:set PADDLE_WEBHOOK_SECRET
firebase functions:secrets:set GROQ_API_KEY
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run cap:build
npm run cap:android
npm run cap:ios
npm run cap:sync
```

## Deploy

### Web y reglas Firebase

```bash
npm run build
firebase deploy --only firestore:rules,storage:rules
```

### Cloud Functions

```bash
firebase deploy --only functions
```

### Android

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

Para Play Store se debe generar un AAB firmado desde Android Studio o Gradle con una keystore de produccion.

### iOS

```bash
npm run build
npx cap sync ios
```

Abrir `ios/App/App.xcodeproj` en Xcode sobre macOS, configurar signing/capabilities y archivar para App Store Connect.

## Notas de produccion

- Los campos de suscripcion se actualizan desde Cloud Functions/webhooks, no desde el cliente.
- El checkout de Paddle en Android/iOS se abre en navegador externo para evitar problemas de WebView con 3DS.
- Ejecutar `npm run lint`, `npm run build`, `npm audit --omit=dev` y build nativo antes de publicar.
