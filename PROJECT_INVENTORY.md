# PROJECT INVENTORY — Stratega Planner
**Fecha de auditoría:** 2026-03-18
**Versión del proyecto:** 0.0.0 (package.json)
**URL de producción:** https://virtualstudios6.github.io/stratega/
**Repositorio:** GitHub (deploy via `gh-pages`)

---

## 1. ESTRUCTURA DE CARPETAS

```
stratega-planner/
├── .env                          # Variables de entorno (no incluido en git)
├── index.html                    # Entry point HTML
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── subir.bat                     # Script Windows para deploy manual
│
├── public/
│   ├── firebase-messaging-sw.js  # Service Worker para FCM (push notifications)
│   ├── vite.svg
│   ├── iconos/                   # Iconos de la PWA (manifest icons)
│   ├── images/                   # Imágenes estáticas del landing
│   └── logos/                    # Logo de la app (logo.png)
│
├── functions/
│   ├── index.js                  # Cloud Function: recordatorios programados (cada 5 min)
│   └── package.json              # Dependencias de la función (firebase-admin, firebase-functions)
│
└── src/
    ├── main.jsx                  # Punto de entrada React (BrowserRouter, ThemeProvider, i18n)
    ├── App.jsx                   # Router principal con todas las rutas
    ├── App.css                   # Estilos mínimos base
    ├── index.css                 # CSS global: variables, keyframes, clases utilitarias
    │
    ├── assets/
    │   └── react.svg             # Asset por defecto de Vite (no usado en producción)
    │
    ├── components/
    │   ├── layout/
    │   │   ├── DashboardLayout.jsx   # Layout principal con sidebar + topbar
    │   │   ├── Sidebar.jsx           # Menú lateral (desktop colapsable + móvil overlay)
    │   │   └── BottomNav.jsx         # Navegación inferior (actualmente NO usada — desactivada)
    │   └── shared/
    │       ├── AIAssistant.jsx       # Chat IA flotante (Groq/Llama)
    │       ├── AppTour.jsx           # Tour guiado de onboarding paso a paso
    │       ├── GlobalSearch.jsx      # Búsqueda global (Ctrl+K)
    │       ├── LanguageSwitcher.jsx  # Selector de idioma (6 idiomas)
    │       ├── NotificationBell.jsx  # Campana de notificaciones (recordatorios pendientes)
    │       ├── OnboardingWizard.jsx  # Wizard inicial para nuevos usuarios
    │       ├── PrivateRoute.jsx      # Guard de rutas autenticadas
    │       ├── ProgressStats.jsx     # Componente de estadísticas de progreso
    │       └── SmartNotifications.jsx # Banner de notificaciones inteligentes
    │
    ├── context/
    │   ├── AuthContext.jsx       # Contexto de autenticación Firebase
    │   └── ThemeContext.jsx      # Contexto de temas: oscuro, claro, medianoche
    │
    ├── data/
    │   └── fechasClave.js        # Array estático: ~60 fechas clave (2025-2026) con sugerencias
    │
    ├── firebase/
    │   ├── config.js             # Inicialización Firebase (app, db, storage, auth)
    │   ├── auth.js               # Funciones de autenticación (email, Google, Facebook)
    │   ├── firestore.js          # [VACÍO — 1 línea] Sin exports útiles
    │   ├── storage.js            # [VACÍO — 1 línea] Sin exports útiles
    │   ├── notifications.js      # FCM: initFCM(), onForegroundMessage()
    │   └── deleteUserData.js     # Borrado completo de datos del usuario al eliminar cuenta
    │
    ├── hooks/
    │   ├── useFCM.js                     # Hook: registra token FCM al iniciar sesión
    │   ├── useReminderNotifications.js   # Hook: notificaciones del navegador para recordatorios
    │   └── useSmartNotifications.js      # Hook: notificaciones inteligentes (días sin contenido)
    │
    ├── i18n/
    │   ├── index.js              # Configuración i18next (idioma por defecto: es)
    │   └── locales/
    │       ├── es.json           # Español (~495 claves)
    │       ├── en.json           # Inglés (~495 claves)
    │       ├── pt.json           # Portugués (~495 claves)
    │       ├── fr.json           # Francés (~495 claves)
    │       ├── de.json           # Alemán (~495 claves)
    │       └── it.json           # Italiano (~495 claves)
    │
    ├── pages/
    │   ├── Auth/
    │   │   ├── Login.jsx         # Login email + Google + Facebook
    │   │   ├── Register.jsx      # Registro email + Google + Facebook
    │   │   └── ForgotPassword.jsx
    │   ├── Landing/
    │   │   ├── Landing.jsx       # Página pública de marketing
    │   │   └── Landing.css       # Estilos específicos del landing
    │   ├── Dashboard/
    │   │   └── Dashboard.jsx     # Panel principal con métricas
    │   ├── Planner/
    │   │   └── Planner.jsx       # Calendario de contenido + exportación PDF
    │   ├── Feed/
    │   │   └── Feed.jsx          # Organizador de feed visual drag & drop
    │   ├── Reminders/
    │   │   └── Reminders.jsx     # Gestión de recordatorios con fechas
    │   ├── Folders/
    │   │   └── Folders.jsx       # Carpetas con archivos, vinculación a otros módulos
    │   ├── Quotes/
    │   │   ├── Quotes.jsx        # Cotizaciones y facturas con generación PDF
    │   │   └── QuotePresentation.jsx  # Vista pública de cotización (ruta /quotes/ver/:id)
    │   ├── Accounting/
    │   │   └── Accounting.jsx    # Contabilidad: ingresos/gastos con gráficos
    │   ├── Team/
    │   │   └── Team.jsx          # [PLACEHOLDER — sección en mantenimiento]
    │   ├── Settings/
    │   │   └── Settings.jsx      # Configuración: perfil, seguridad, apariencia, notificaciones
    │   └── Subscription/
    │       └── Subscription.jsx  # Planes y pagos (Lemon Squeezy)
    │
    ├── services/
    │   └── groq.js               # Cliente API Groq (llama-3.1-8b-instant)
    │
    └── utils/
        └── compressImage.js      # Utilidad: compresión de imágenes antes de subir a Storage
```

---

## 2. MÓDULOS / PÁGINAS IMPLEMENTADAS

### Páginas públicas

| Página | Archivo | Ruta | Estado |
|--------|---------|------|--------|
| Landing | `Landing.jsx` | `/` | ✅ Completo |
| Login | `Login.jsx` | `/login` | ✅ Completo |
| Registro | `Register.jsx` | `/register` | ✅ Completo |
| Recuperar contraseña | `ForgotPassword.jsx` | `/forgot-password` | ✅ Completo |

---

### Páginas privadas (requieren autenticación)

#### Dashboard — `/dashboard`
- **Archivo:** `Dashboard.jsx` (713 líneas)
- **Funcionalidades implementadas:**
  - Tarjetas de métricas: publicaciones esta semana, recordatorios pendientes, ingresos del mes, cotizaciones activas
  - SparkLine SVG con tendencia de últimos meses
  - Accesos rápidos a todas las secciones
  - Vista de próximos recordatorios (hasta 5)
  - Vista de últimas transacciones contables
  - SmartNotifications (banner de días sin contenido planificado)
  - Datos cargados en paralelo con `Promise.all`
- **Estado:** ✅ Completo

---

#### Planner — `/planner`
- **Archivo:** `Planner.jsx` (1130 líneas)
- **Funcionalidades implementadas:**
  - Calendario mensual con FullCalendar (dayGrid + timeGrid + interaction)
  - Vista lista alternativa (toggle calendario / lista)
  - Plataformas soportadas: Instagram, YouTube, Facebook, Telegram, TikTok
  - Formatos: Reel, Carrusel, Historia, Video corto
  - Prioridades: Urgente, Importante, Normal
  - Fechas clave integradas (~60 fechas globales 2025-2026 con sugerencias de contenido)
  - CRUD completo de eventos (crear, editar, eliminar)
  - Modal de detalle de evento al clic
  - Modal de sugerencia al clicar una fecha clave
  - Exportación PDF de la semana actual con `jsPDF + autoTable`
  - Toggle para mostrar/ocultar fechas clave
  - Colores por prioridad en el calendario
- **Estado:** ✅ Completo

---

#### Feed — `/feed`
- **Archivo:** `Feed.jsx` (944 líneas)
- **Funcionalidades implementadas:**
  - Gestión de múltiples feeds/perfiles sociales
  - Grid de imágenes y videos con drag & drop (dnd-kit)
  - Subida de imágenes con compresión automática
  - Subida de videos a Firebase Storage
  - Reordenamiento de piezas con persistencia
  - Vista previa de pieza individual (lightbox)
  - Creación/edición/eliminación de feeds
  - Vinculación de feeds a carpetas
  - Caption por imagen/video
  - Contador de publicaciones por feed
  - Avatar y nombre de perfil por feed
- **Estado:** ✅ Completo

---

#### Recordatorios — `/reminders`
- **Archivo:** `Reminders.jsx` (419 líneas)
- **Funcionalidades implementadas:**
  - CRUD completo de recordatorios
  - Campos: título, descripción, fecha/hora, prioridad, categoría, carpeta
  - Prioridades: Urgente, Importante, Normal (con colores)
  - Categorías: General, Publicación, Reunión, Contenido, Cliente, Personal, Empresa, Marketing, Negocios, Ideas, Pendiente
  - Filtros: Todos, Urgente, Importante, Normal
  - Marcar como completado/pendiente
  - DatePicker con localización (español)
  - Solicitud de permiso de notificaciones del navegador
  - Vinculación a carpetas existentes
  - Ordenado por fecha ascendente
- **Estado:** ✅ Completo

---

#### Carpetas — `/folders`
- **Archivo:** `Folders.jsx` (601 líneas)
- **Funcionalidades implementadas:**
  - CRUD de carpetas con nombre y color personalizable (14 colores)
  - Subida de archivos: imágenes, videos, PDFs, documentos
  - Compresión automática de imágenes antes de subir
  - Vista previa de archivos (lightbox para imágenes/videos)
  - Descarga de archivos
  - Visualización de feeds vinculados a la carpeta
  - Visualización de eventos del planner vinculados
  - Visualización de recordatorios vinculados
  - Panel lateral de detalle de carpeta
- **Estado:** ✅ Completo

---

#### Cotizaciones — `/quotes`
- **Archivo:** `Quotes.jsx` (1102 líneas)
- **Funcionalidades implementadas:**
  - Generador de cotizaciones con 3 plantillas PDF (Minimal, Dark Pro, Classic)
  - Generador de facturas con los mismos templates
  - Vista previa en pantalla del documento
  - Perfil de empresa persistente (logo, nombre, email, teléfono, dirección, web)
  - Extracción de colores dominantes del logo (Canvas API) — genera gradientes inteligentes
  - 44 monedas disponibles
  - 8 tipografías (mapeadas a 3 fuentes nativas de jsPDF)
  - Estados de cotización: Borrador, Enviada, Aprobada, Rechazada
  - Estados de factura: Borrador, Emitida, Pagada, Anulada
  - CRUD completo de cotizaciones y facturas
  - Descarga PDF
  - Link público de presentación (`/quotes/ver/:id`)
  - Exportación por secciones del documento
- **Estado:** ✅ Completo

---

#### Cotización Pública — `/quotes/ver/:id`
- **Archivo:** `QuotePresentation.jsx`
- **Funcionalidades implementadas:**
  - Vista pública sin necesidad de login
  - Carga datos de Firestore por ID
  - Muestra la cotización en formato visual
- **Estado:** ✅ Completo

---

#### Contabilidad — `/accounting`
- **Archivo:** `Accounting.jsx` (518 líneas)
- **Funcionalidades implementadas:**
  - Registro de ingresos y gastos
  - Campos: descripción, monto, categoría, fecha, notas
  - Categorías sugeridas: Servicio, Cotización, Consultoría, Producto, Herramientas, Publicidad, Personal, Oficina, Transporte, Otro
  - Filtro por mes y año
  - Resumen: total ingresos, total gastos, balance neto
  - Gráfico de barras mensual (Recharts)
  - Gráfico de tarta por categoría (Recharts)
  - CRUD completo (crear, editar, eliminar)
  - Modal de reporte mensual con desglose por categoría
- **Estado:** ✅ Completo

---

#### Equipo — `/team`
- **Archivo:** `Team.jsx` (29 líneas)
- **Funcionalidades implementadas:** Ninguna
- **Estado:** ❌ PLACEHOLDER — Muestra mensaje "Sección en mantenimiento / Próximamente disponible". La ruta es accesible y está en el menú de navegación.

---

#### Configuración — `/settings`
- **Archivo:** `Settings.jsx` (494 líneas)
- **Funcionalidades implementadas:**
  - Tab "Perfil": nombre, cargo, empresa, teléfono, bio, website, avatar (subida a Storage)
  - Tab "Seguridad": cambio de contraseña, eliminación de cuenta (con reautenticación)
  - Tab "Apariencia": selector de tema (oscuro, claro, medianoche)
  - Tab "Notificaciones": toggle de preferencias (guardadas en Firestore)
  - Reautenticación soportada: email/contraseña y Google
  - Eliminación de cuenta: borra todos los datos de Firestore + Storage + cuenta Firebase Auth
  - Selector de idioma integrado
- **Estado:** ✅ Completo

---

#### Suscripción — `/subscription`
- **Archivo:** `Subscription.jsx` (173 líneas)
- **Funcionalidades implementadas:**
  - Muestra dos planes: Básico ($6.99/mes · $67/año) y Pro ($11.99/mes · $115/año)
  - Toggle mensual/anual con ahorro del 20%
  - Botón de checkout que abre Lemon Squeezy con email y user_id del usuario
  - Lista de features por plan
- **Bugs conocidos:**
  - Precios hardcodeados en el componente (no sincronizados con el proveedor de pagos)
  - No hay detección del plan actual del usuario (siempre muestra los dos planes sin indicar cuál tiene)
  - No hay webhook listener para actualizar el estado de suscripción en Firestore
- **Estado:** ⚠️ Parcial — Checkout funciona, pero sin gestión del estado de suscripción activa

---

#### Landing — `/`
- **Archivo:** `Landing.jsx` (303 líneas) + `Landing.css`
- **Funcionalidades implementadas:**
  - Hero con badge, CTA principal y secundario
  - Sección de estadísticas (módulos, cloud, IA, días gratis)
  - Sección de features con iconos Lucide reales
  - Demo de chat IA
  - Tabla comparativa de planes con precios
  - CTA final
  - Selector de idioma (6 idiomas)
  - Sección "Cómo funciona" (3 pasos)
- **Estado:** ✅ Completo

---

## 3. FIREBASE

### Colecciones de Firestore

| Colección | Descripción | Clave de filtro | Usado en |
|-----------|-------------|-----------------|----------|
| `users` | Perfil del usuario | doc ID = `uid` | Settings, Sidebar, NotificationBell, FCM |
| `company_profiles` | Perfil de empresa para cotizaciones | doc ID = `uid` | Quotes |
| `planners` | Eventos del calendario de contenido | `uid` | Planner, Dashboard, useSmartNotifications |
| `reminders` | Recordatorios con fecha y prioridad | `uid` | Reminders, Dashboard, NotificationBell, Cloud Function |
| `feeds` | Feeds/perfiles sociales del usuario | `uid` | Feed, Folders |
| `feed_posts` | ⚠️ Referenciada en deleteUserData.js pero **NO coincide** con la colección real (`feeds`) | `uid` | Solo en deleteUserData.js (bug) |
| `folders` | Carpetas del usuario | `uid` | Folders, Reminders |
| `folder_files` | Archivos dentro de carpetas | `folderId` | Folders |
| `quotes` | Cotizaciones y facturas | `uid` | Quotes |
| `accounting` | Transacciones contables | `uid` | Accounting, Dashboard |
| `team_members` | Miembros del equipo | `uid` | Solo en deleteUserData.js (módulo no implementado) |

> ⚠️ **Bug detectado:** `deleteUserData.js` borra la colección `feed_posts` pero los datos reales del Feed se guardan en `feeds`. Al eliminar una cuenta, los posts del feed del usuario **no se borran** de Firestore.

### Rutas de Firebase Storage

| Ruta | Descripción | Usado en |
|------|-------------|----------|
| `avatars/{uid}` | Foto de perfil del usuario | Settings |
| `feed/{uid}/{feedId}/{filename}` | Imágenes y videos del organizador de feed | Feed |
| `folders/{uid}/{folderId}/{filename}` | Archivos subidos a carpetas | Folders |

### Proveedores de Authentication

| Proveedor | Estado |
|-----------|--------|
| Email / Contraseña | ✅ Activo |
| Google (OAuth) | ✅ Activo |
| Facebook (OAuth) | ✅ Activo en código — requiere app de Facebook configurada en Firebase Console |

### Firebase Cloud Functions

| Función | Trigger | Descripción | Estado |
|---------|---------|-------------|--------|
| `sendReminderNotifications` | Scheduled: cada 5 minutos | Busca recordatorios próximos (±1 min y 5 min antes) y envía FCM push a los tokens registrados. Limpia tokens caducados. | ✅ Implementada (requiere plan Blaze + deploy manual) |

### Firebase Cloud Messaging (FCM)

- Service Worker registrado en `public/firebase-messaging-sw.js`
- Tokens FCM guardados en `users/{uid}.fcmToken`
- Notificaciones en primer plano: `onForegroundMessage` (hook `useFCM`)
- Notificaciones del navegador nativas: `useReminderNotifications` (comprueba cada minuto)

---

## 4. INTEGRACIONES EXTERNAS

### Groq AI
- **API:** `https://api.groq.com/openai/v1/chat/completions`
- **Modelo:** `llama-3.1-8b-instant`
- **Clave:** `VITE_GROQ_API_KEY` (expuesta en bundle del cliente)
- **Uso:** Asistente IA flotante (`AIAssistant.jsx`)
- **Parámetros:** `max_tokens: 1024`, `temperature: 0.7`
- **Estado:** ✅ Funciona — ⚠️ La clave API es accesible desde el navegador (cualquier usuario puede inspeccionarla y usarla con cargo a la cuenta del propietario)

### Lemon Squeezy (pagos)
- **Checkout URL:** `https://strategaplanner.lemonsqueezy.com/checkout/buy/{variantId}`
- **Parámetros:** `checkout[email]`, `checkout[custom][user_id]`
- **Variables de entorno requeridas:**
  - `VITE_LS_BASIC_MONTHLY`
  - `VITE_LS_BASIC_ANNUAL`
  - `VITE_LS_PRO_MONTHLY`
  - `VITE_LS_PRO_ANNUAL`
- **Estado:** ⚠️ Parcial — El botón de compra funciona. No hay webhook implementado para confirmar pagos ni para actualizar el plan activo del usuario en Firestore. No hay lógica de acceso por plan (cualquier usuario ve todas las funciones).

### GitHub Pages (deployment)
- **URL:** `https://virtualstudios6.github.io/stratega/`
- **Comando:** `npm run deploy` (`gh-pages -d dist`)
- **Estado:** ✅ Activo

---

## 5. DEPENDENCIAS PRINCIPALES

### Producción

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | ^19.2.0 | Framework principal |
| `react-dom` | ^19.2.0 | Renderizado DOM |
| `react-router-dom` | ^7.13.1 | Enrutamiento SPA |
| `firebase` | ^12.10.0 | Auth, Firestore, Storage, FCM |
| `@fullcalendar/react` | ^6.1.20 | Calendario interactivo en Planner |
| `@fullcalendar/daygrid` | ^6.1.20 | Vista mensual del calendario |
| `@fullcalendar/timegrid` | ^6.1.20 | Vista semanal/diaria del calendario |
| `@fullcalendar/interaction` | ^6.1.20 | Drag & click en el calendario |
| `@dnd-kit/core` | ^6.3.1 | Drag & drop base (Feed) |
| `@dnd-kit/sortable` | ^10.0.0 | Orden arrastrable de imágenes |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform utilities para dnd |
| `jspdf` | ^4.2.0 | Generación de PDFs (cotizaciones, planner) |
| `jspdf-autotable` | ^5.0.7 | Tablas en PDFs |
| `recharts` | ^3.7.0 | Gráficos (contabilidad, dashboard) |
| `lucide-react` | ^0.575.0 | Iconos vectoriales |
| `react-datepicker` | ^9.1.0 | Selector de fecha en Recordatorios |
| `date-fns` | ^4.1.0 | Utilidades de fechas (localización) |
| `i18next` | ^25.8.14 | Internacionalización |
| `react-i18next` | ^16.5.5 | Hook y HOC de i18n para React |
| `react-hot-toast` | ^2.6.0 | Notificaciones toast |

### Desarrollo

| Paquete | Versión | Uso |
|---------|---------|-----|
| `vite` | ^7.3.1 | Bundler y dev server |
| `@vitejs/plugin-react` | ^5.1.1 | Plugin React para Vite |
| `tailwindcss` | ^3.4.19 | CSS utility-first |
| `autoprefixer` | ^10.4.27 | PostCSS autoprefixer |
| `eslint` | ^9.39.1 | Linter |
| `gh-pages` | ^6.3.0 | Deploy a GitHub Pages |

---

## 6. VARIABLES DE ENTORNO REQUERIDAS

Archivo: `.env` (no incluido en git — ⚠️ debe configurarse manualmente en cada entorno)

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=       # Opcional (Analytics)
VITE_FIREBASE_VAPID_KEY=            # Obligatorio para FCM push notifications

# IA
VITE_GROQ_API_KEY=                  # API Key de Groq (expuesta en cliente)

# Pagos
VITE_LS_BASIC_MONTHLY=              # Variant ID Lemon Squeezy
VITE_LS_BASIC_ANNUAL=
VITE_LS_PRO_MONTHLY=
VITE_LS_PRO_ANNUAL=
```

> ⚠️ Todas las variables con prefijo `VITE_` son accesibles desde el navegador. Considerar mover las claves sensibles (Groq) a un backend proxy.

---

## 7. TEMAS DISPONIBLES

| ID | Nombre | Color primario | Estado |
|----|--------|---------------|--------|
| `oscuro` | Oscuro | `#6022EC` (morado) | ✅ Activo |
| `claro` | Claro | `#c18c35` (dorado) | ✅ Activo (por defecto) |
| `medianoche` | Medianoche | `#5B1FD9` (morado oscuro) | ✅ Activo |

---

## 8. INTERNACIONALIZACIÓN (i18n)

| Idioma | Código | Archivo | Estado |
|--------|--------|---------|--------|
| Español | `es` | `es.json` | ✅ Completo (idioma por defecto) |
| Inglés | `en` | `en.json` | ✅ Completo |
| Portugués | `pt` | `pt.json` | ✅ Completo |
| Francés | `fr` | `fr.json` | ✅ Completo |
| Alemán | `de` | `de.json` | ✅ Completo |
| Italiano | `it` | `it.json` | ✅ Completo |

> ⚠️ Varios componentes tienen strings en español hardcodeados que no usan `t()` y por tanto no se traducen al cambiar de idioma (ver sección 9).

---

## 9. FUNCIONALIDADES PENDIENTES O INCOMPLETAS

### 🔴 Crítico

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| 1 | **Módulo de Equipo no implementado** — pantalla de "mantenimiento" accesible desde el menú | `Team.jsx` | El usuario ve un menú roto; promesa incumplida del plan Básico ("Hasta 3 miembros") y Pro ("Miembros ilimitados") |
| 2 | **Bug en borrado de cuenta** — `deleteUserData.js` borra colección `feed_posts` pero los datos reales se guardan en `feeds`. Los posts del feed de un usuario eliminado permanecen en Firestore. | `deleteUserData.js` | Fuga de datos RGPD/privacidad |
| 3 | **Sin gestión de plan activo** — No hay detección de si el usuario tiene suscripción activa. Todas las funciones son accesibles para todos los usuarios sin verificar el plan contratado. | `Subscription.jsx`, toda la app | El modelo de negocio por planes no está reforzado |
| 4 | **Sin webhook de pagos** — Lemon Squeezy no actualiza ningún campo en Firestore al completarse una compra. | — | Imposible saber qué usuarios han pagado |

### 🟠 Importante

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| 5 | **Clave API de Groq expuesta en el cliente** | `groq.js` | Cualquier visitante puede extraerla del bundle y hacer llamadas con cargo al propietario |
| 6 | **Strings hardcodeados en español** que no se traducen: "Sección en mantenimiento", "Buscar", "Más", "Ocultar correo", "Ver", "Eliminar", "Subir foto", "Reiniciar chat", etc. | BottomNav, DashboardLayout, Team, Feed, Sidebar, AIAssistant, OnboardingWizard | Experiencia rota para usuarios en otros idiomas |
| 7 | **`firestore.js` y `storage.js` están vacíos** (1 línea cada uno) | `firebase/firestore.js`, `firebase/storage.js` | Código muerto; posible confusión si alguien busca la lógica de Firestore aquí |
| 8 | **Precios del plan hardcodeados** en `Subscription.jsx` ($6.99, $11.99, $67, $115) | `Subscription.jsx` | Actualizar precios requiere cambiar código y redesplegar |
| 9 | **Notificaciones solo locales** — La Cloud Function está implementada pero requiere deploy manual a Firebase. Si no está desplegada, las notificaciones push solo funcionan cuando el navegador está abierto. | `functions/index.js` | Feature de recordatorios incompleta en producción si la función no está activa |

### 🟡 Mejoras de calidad

| # | Problema | Ubicación |
|---|----------|-----------|
| 10 | Sin lazy loading de páginas — todas se cargan en el bundle inicial | `App.jsx` |
| 11 | Sin error boundaries — un crash en cualquier componente desmonta toda la app | Global |
| 12 | Sin paginación en listas de cotizaciones, transacciones o recordatorios — escalan mal | Quotes, Accounting, Reminders |
| 13 | Colores duplicados definidos localmente en múltiples páginas (`PIE_COLORS`, `COLORES`) en lugar de una constante compartida | Accounting, Folders |
| 14 | Búsqueda global (Ctrl+K) no busca en transacciones contables ni en archivos de carpetas | `GlobalSearch.jsx` |
| 15 | `react.svg` en `/src/assets/` es el asset por defecto de Vite — no tiene uso en el proyecto | `assets/react.svg` |
| 16 | `BottomNav.jsx` está creado pero desactivado — genera código en el bundle sin usarse | `BottomNav.jsx` |
| 17 | Fechas clave solo incluyen años 2025-2026; habrá que actualizar manualmente cada año | `fechasClave.js` |
| 18 | La Cloud Function hardcodea URLs de producción (`stratega-planner.web.app`) — no funciona en staging/dev | `functions/index.js:70-71` |

---

## 10. RESUMEN EJECUTIVO

| Categoría | Módulos | Completos | Parciales | No implementados |
|-----------|---------|-----------|-----------|-----------------|
| Autenticación | 3 | 3 | 0 | 0 |
| Páginas de app | 10 | 8 | 1 (Subscription) | 1 (Team) |
| Integraciones | 3 | 1 (Groq) | 2 (Lemon Squeezy, FCM) | 0 |
| i18n | 6 idiomas | 6 | 0 | 0 |
| Temas | 3 | 3 | 0 | 0 |

**Total líneas de código (src/):** ~10,400 líneas
**Total archivos fuente:** 54
**Tamaño estimado del bundle (sin node_modules):** Grande — FullCalendar, jsPDF, Recharts, dnd-kit y Firebase son dependencias pesadas sin code-splitting.
