import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.stratega.planner",
  appName: "Stratega Planner",
  webDir: "dist",

  // ── Servidor ────────────────────────────────────────────────────────────
  // En producción NO definimos server.url — la app carga desde el bundle local.
  // Descomenta la línea de abajo SOLO durante desarrollo para live-reload:
  // server: { url: "http://TU_IP_LOCAL:5173", cleartext: true },

  // ── Android ─────────────────────────────────────────────────────────────
  android: {
    // Permite que Firebase y otras peticiones HTTPS funcionen sin errores
    allowMixedContent: false,
    // Color de la barra de estado (se sobreescribe con el plugin StatusBar)
    backgroundColor: "#080810",
    // Habilita captura de teclado para inputs dentro de WebView
    captureInput: true,
    // Escala el texto igual que en el navegador
    webContentsDebuggingEnabled: false, // true solo en desarrollo
  },

  // ── iOS ──────────────────────────────────────────────────────────────────
  ios: {
    backgroundColor: "#080810",
    // "never" para que iOS no añada su propio inset al scroll view;
    // el safe area lo gestionamos nosotros con env(safe-area-inset-top) en CSS.
    // "always" causaba doble padding en iPhone X/14 Pro con nuestra regla #root.
    contentInset: "never",
    // Desactiva rebote al hacer scroll en la raíz (app-like feel)
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: false,
    // Dominios permitidos para navegación (Firebase Auth, Lemon Squeezy, Groq)
    appendUserAgent: "StrategaPlanner/1.0",
  },

  // ── Plugins ──────────────────────────────────────────────────────────────
  plugins: {
    // Barra de estado nativa
    StatusBar: {
      style: "Dark",          // texto blanco sobre barra oscura
      backgroundColor: "#080810",
      // true = WebView se extiende edge-to-edge detrás del status bar.
      // Con false se suponía que el WebView empezaba debajo del status bar,
      // pero Android 15 (API 35) fuerza edge-to-edge ignorando esta flag.
      // Al optar explícitamente por true, env(safe-area-inset-top) en CSS
      // recibe el valor correcto (altura del status bar) en todos los dispositivos.
      overlaysWebView: true,
    },

    // Pantalla de splash
    SplashScreen: {
      launchShowDuration: 0,             // no auto-ocultar por tiempo
      launchAutoHide: false,             // lo ocultamos manualmente desde App.jsx
      backgroundColor: "#080810",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      fadeOutDuration: 300,              // fade suave al ocultar
    },

    // Teclado virtual
    Keyboard: {
      resize: "body",          // el body se redimensiona cuando aparece el teclado
      style: "dark",
      resizeOnFullScreen: true,
    },

    // Push Notifications (FCM nativo — reemplaza firebase-messaging-sw.js en mobile)
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    // App (backButton en Android)
    App: {},

    // Google Sign-In nativo para Android e iOS
    // clientId = iOS CLIENT_ID del GoogleService-Info.plist
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
      // Necesario para que el plugin inicialice correctamente en iOS
      googleClientId: "1022294410705-oo4il4e2c71l7spao9p1dhltleu1d6gt.apps.googleusercontent.com",
    },
  },
}

export default config
