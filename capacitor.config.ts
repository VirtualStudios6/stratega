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
    contentInset: "always",
    // Desactiva rebote al hacer scroll en la raíz (app-like feel)
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: true,
    // Dominios permitidos para navegación (Firebase Auth, Lemon Squeezy, Groq)
    appendUserAgent: "StrategaPlanner/1.0",
  },

  // ── Plugins ──────────────────────────────────────────────────────────────
  plugins: {
    // Barra de estado nativa
    StatusBar: {
      style: "Dark",          // texto blanco sobre barra oscura
      backgroundColor: "#080810",
      overlaysWebView: false,
    },

    // Pantalla de splash
    SplashScreen: {
      launchShowDuration: 2000,          // ms que se muestra el splash
      launchAutoHide: true,
      backgroundColor: "#080810",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
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
    // serverClientId = Web Client ID (tipo 3) del google-services.json
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  },
}

export default config
