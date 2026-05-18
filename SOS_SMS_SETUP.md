# Sistema de Notificaciones SOS por SMS - Guía de Configuración

## ✅ Implementación Completada

Se ha implementado el sistema completo de notificaciones SOS por SMS con los siguientes componentes:

### 📦 Archivos Creados

1. **Cloud Functions** (`functions/`)
   - `index.js` - Lógica de notificaciones SMS
   - `package.json` - Dependencias Node.js
   - `.env.example` - Template de configuración
   - `.gitignore` - Archivos a ignorar

2. **Página de Tracking** (`app/track/`)
   - `index.html` - Interfaz de tracking
   - `styles.css` - Estilos personalizados

3. **Configuración**
   - `firestore.rules` - Actualizado para acceso público a tracking
   - `firebase.json` - Configurado hosting y functions
   - `.env.example` - Variables Twilio agregadas

---

## 🚀 Pasos de Configuración

### 1. Configurar Twilio

1. Ve a [console.twilio.com](https://console.twilio.com/)
2. Crea una cuenta o inicia sesión
3. En el Dashboard, copia:
   - **Account SID**
   - **Auth Token**
4. Tu número ya comprado: `+33 9 39 24 67 67`

### 2. Configurar Variables de Entorno

Crea el archivo `functions/.env` con este contenido:

```env
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_PHONE_NUMBER=+33939246767
TRACKING_URL=https://vzalabardo.github.io/urbanguardian/track
```

### 3. Instalar Dependencias de Cloud Functions

```bash
cd functions
npm install
```

### 4. Desplegar Cloud Functions

```bash
# Desde la raíz del proyecto (urbanguardian/)
firebase deploy --only functions
```

Esto desplegará dos funciones:
- `onSOSCreated` - Se activa cuando se crea una alerta SOS
- `onSOSUpdated` - Se activa cuando se desactiva una alerta

### 5. Actualizar Reglas de Firestore

```bash
firebase deploy --only firestore:rules
```

### 6. Desplegar Página de Tracking a GitHub Pages

La página de tracking está en `app/track/`. Para que funcione en GitHub Pages:

1. Asegúrate de que tu repo esté configurado para GitHub Pages desde la carpeta `/app`
2. La URL de tracking será: `https://vzalabardo.github.io/urbanguardian/track/?id={alertId}`

---

## 📱 Flujo Completo del Sistema

### Cuando un usuario activa SOS:

1. **Usuario pulsa botón SOS** en la app
2. **`sos.js`** crea documento en `sos_alerts` con ubicación GPS
3. **Cloud Function `onSOSCreated`** se dispara automáticamente:
   - Lee `trustedContacts` del usuario
   - Envía SMS a cada contacto:
     ```
     ⚠️ ALERTA SOS
     Ana García ha activado una emergencia.
     Ver ubicación: https://vzalabardo.github.io/urbanguardian/track?id=ABC123
     UrbanGuardian
     ```
   - Actualiza documento con `notifiedContacts`

4. **Contacto recibe SMS** y hace clic en el link
5. **Página de tracking** carga:
   - Muestra mapa con ubicación del usuario
   - Estado de la alerta (activa/desactivada)
   - Registro de actividad
   - Precisión GPS

### Cuando el usuario desactiva SOS:

1. **Usuario introduce PIN** (real o falso)
2. **`sos.js`** actualiza documento con `status: 'deactivated'`
3. **Cloud Function `onSOSUpdated`** se dispara:
   - Si PIN real: envía SMS "✅ Alerta desactivada"
   - Si PIN falso: envía SMS "⚠️ Posible coacción"

---

## 💰 Costes Estimados

### Twilio
- **Número francés**: $1.35/mes
- **SMS internacional** (Francia → España): ~€0.08-0.10/SMS
- **Ejemplo**: 50 SOS/mes × 3 contactos = 150 SMS = ~€15/mes

### Firebase
- **Cloud Functions**: 2M invocaciones/mes gratis → $0
- **Firestore reads**: incluidas en tier gratuito → $0
- **Hosting**: GitHub Pages → $0

**Total estimado**: €16-17/mes (principalmente SMS)

---

## 🧪 Probar el Sistema

### Localmente (Emuladores)

```bash
# Terminal 1: Emuladores de Firebase
firebase emulators:start

# Terminal 2: Servidor local de la app
cd app
python -m http.server 8080
```

### En Producción

1. Agrega contactos de confianza en la app (con números reales)
2. Activa SOS desde la app
3. Verifica que los SMS lleguen
4. Haz clic en el link del SMS
5. Verifica que la página de tracking muestre la ubicación

---

## 📋 Checklist de Deployment

- [ ] Cuenta Twilio creada
- [ ] Número `+33 9 39 24 67 67` comprado en Twilio
- [ ] Variables en `functions/.env` configuradas
- [ ] `npm install` ejecutado en `/functions`
- [ ] Cloud Functions desplegadas (`firebase deploy --only functions`)
- [ ] Reglas de Firestore actualizadas (`firebase deploy --only firestore:rules`)
- [ ] Página de tracking accesible en GitHub Pages
- [ ] Prueba real con número de teléfono de confianza

---

## 🔧 Troubleshooting

### Los SMS no se envían

1. Verifica logs de Cloud Functions:
   ```bash
   firebase functions:log
   ```

2. Verifica que las variables de entorno estén correctas:
   ```bash
   firebase functions:config:get
   ```

3. Verifica saldo de Twilio en el dashboard

### La página de tracking no carga

1. Verifica que el `alertId` en la URL sea válido
2. Abre la consola del navegador para ver errores
3. Verifica que las reglas de Firestore permitan lectura pública de `sos_alerts`

### Los contactos no tienen teléfono

1. Ve a la app → Perfil → Contactos de emergencia
2. Edita cada contacto y agrega número con formato internacional: `+34612345678`

---

## 🎯 Próximas Mejoras (Post-MVP)

- [ ] Tracking en tiempo real (actualización de ubicación cada 5s)
- [ ] Notificaciones push además de SMS
- [ ] Historial de alertas SOS en el perfil
- [ ] Botón "Estoy bien" en la página de tracking
- [ ] Migrar a WhatsApp Business API (gratis hasta 1000 msgs/mes)
- [ ] Acortar URLs con bit.ly para SMS más cortos

---

## 📞 Soporte

Si tienes problemas, revisa:
1. Logs de Cloud Functions: `firebase functions:log`
2. Consola de Twilio: [console.twilio.com](https://console.twilio.com/)
3. Consola de Firebase: [console.firebase.google.com](https://console.firebase.google.com/)
