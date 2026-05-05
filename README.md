# Urban Guardian 🛡️

App móvil de seguridad urbana — rutas seguras, red de Guardians, SOS silencioso e incidentes geolocalizados en tiempo real.

> `index.html` / `styles.css` / `app.js` en la raíz son el **prototipo visual de referencia**. La aplicación real vive en `app/`.

---

## ⚙️ Setup — Primeros pasos

### 1. Crear proyecto Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) → **Crear proyecto**
2. **Authentication** → Habilitar proveedor **Email/Contraseña**
3. **Firestore Database** → Crear base de datos (modo producción)
4. **Storage** → Activar con reglas por defecto
5. **Project Settings → Your apps → Add app (Web)** → Copiar la config

### 2. Configurar firebase-config.js

Abre `app/firebase-config.js` y reemplaza los placeholders:

```js
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT_ID.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};

export const MAPBOX_TOKEN = "pk.TU_TOKEN_MAPBOX";
```

### 3. Obtener token de Mapbox

1. Regístrate en [account.mapbox.com](https://account.mapbox.com)
2. **Access Tokens → Create a token** con scopes: `styles:read`, `tiles:read`, `directions:read`
3. Pégalo en `firebase-config.js` como `MAPBOX_TOKEN`

### 4. Desplegar reglas de Firestore

```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

firebase login
firebase init firestore   # selecciona tu proyecto
firebase deploy --only firestore:rules
```

---

## 🐳 Deploy con Docker (servidor propio)

```bash
# 1. Copia y configura variables de entorno
cp .env.example .env
# Edita .env: pon el puerto libre que quieras (PORT=8080)

# 2. Construir y arrancar
docker compose up -d --build

# 3. Ver logs
docker compose logs -f

# 4. Parar
docker compose down
```

El contenedor sirve los estáticos de `app/` con nginx en el puerto configurado.

### Reverse proxy (Traefik / nginx-proxy)

Si usas un proxy inverso en tu servidor, descomenta la sección `networks` en `docker-compose.yml` y configura las labels de tu proxy. Elimina el mapeo de puertos si el proxy accede directamente al contenedor.

---

## � Deploy en Firebase Hosting (alternativa)

```bash
firebase init hosting   # public dir: app
firebase deploy --only hosting
```

---

## 📂 Estructura del proyecto

```
urbanguardian/
├── app/                        ← App real (punto de entrada)
│   ├── index.html              ← Splash screen + routing de sesión
│   ├── firebase-config.js      ← Config Firebase + Mapbox token
│   ├── map.html                ← Vista principal mapa (FASE 3)
│   ├── css/
│   │   └── app.css             ← Design system completo
│   ├── js/
│   │   ├── auth.js             ← Firebase Auth
│   │   ├── map.js              ← Mapbox GL JS
│   │   ├── incidents.js        ← CRUD incidentes Firestore
│   │   ├── routing.js          ← Mapbox Directions + safety score
│   │   ├── guardians.js        ← Sesiones Guardian
│   │   ├── sos.js              ← SOS simulado (NO llama a emergencias)
│   │   ├── profile.js          ← Perfil, stats, logros
│   │   └── notifications.js    ← Notificaciones en tiempo real
│   └── auth/
│       ├── onboarding.html     ← 3 slides bienvenida
│       ├── login.html          ← Email/password login
│       ├── register.html       ← Registro con validación
│       └── setup-profile.html  ← Foto, teléfono, PINs, contactos
├── index.html                  ← Prototipo visual (solo referencia)
├── styles.css                  ← Estilos del prototipo
├── app.js                      ← JS del prototipo
├── firestore.rules             ← Security rules para las 8 colecciones
├── Dockerfile                  ← nginx:alpine sirviendo app/
├── docker-compose.yml          ← Puerto configurable via .env
├── nginx.conf                  ← SPA routing + gzip + cache headers
└── .env.example                ← Variables documentadas
```

---

## 🗄️ Colecciones Firestore

| Colección | Descripción |
|-----------|-------------|
| `users` | Perfil, stats, PINs, contactos de emergencia |
| `incidents` | Incidentes geolocalizados (expiran 48h) |
| `routes` | Rutas calculadas con safety score |
| `guardian_sessions` | Guardians activos y su ubicación |
| `sos_alerts` | Alertas SOS (simuladas) |
| `notifications` | Notificaciones in-app |
| `achievements` | Catálogo de logros (público) |
| `user_achievements/{uid}/achievements` | Logros desbloqueados por usuario |

---

## ⚠️ Aviso importante

El sistema **SOS es 100% simulado**. No llama a servicios de emergencia, no contacta a nadie automáticamente. Crea un registro en Firestore y muestra feedback visual. No usar en emergencias reales.

---

## 🗺️ Fases de desarrollo

| Fase | Estado | Contenido |
|------|--------|-----------|
| FASE 1 | ✅ Completa | Foundation — estructura, Firebase config, Docker |
| FASE 2 | 🔜 | Auth — login, registro, onboarding, setup perfil |
| FASE 3 | � | Mapa + Incidentes en tiempo real |
| FASE 4 | 🔜 | Routing seguro via Mapbox Directions |
| FASE 5 | 🔜 | Guardians — toggle, mapa, ubicación |
| FASE 6 | 🔜 | SOS + Perfil + Logros |
