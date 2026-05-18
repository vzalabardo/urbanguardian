# Sistema de Notificaciones SOS por Email - Guía de Configuración

## ✅ Implementación Completada

Se ha implementado el sistema completo de notificaciones SOS por **Email** (usando Resend) en lugar de SMS.

### 🎯 Por qué Email en lugar de SMS

- **Sin verificaciones burocráticas** (DNI, facturas, Regulatory Bundles)
- **Completamente gratis** hasta 3000 emails/mes (100/día)
- **Setup en 10 minutos** vs días de espera
- **Perfecto para MVP** y demostraciones

---

## 📦 Archivos Creados/Modificados

1. **Cloud Functions** (`functions/`)
   - `index.js` - Notificaciones por email con templates HTML
   - `package.json` - Dependencia `resend` en lugar de `twilio`
   - `.env.example` - Variables de Resend

2. **Página de Tracking** (`app/track/`)
   - `index.html` - Interfaz de tracking (sin cambios)
   - `styles.css` - Estilos (sin cambios)

3. **Configuración**
   - `.env.example` - Variables Resend agregadas

---

## 🚀 Pasos de Configuración

### 1. Crear Cuenta en Resend

1. Ve a [resend.com](https://resend.com)
2. Crea cuenta (gratis, sin tarjeta de crédito)
3. Verifica tu email

### 2. Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Clic en **Create API Key**
3. Dale un nombre: "UrbanGuardian SOS"
4. Copia la API key (empieza con `re_...`)

### 3. Configurar Dominio (Opcional pero Recomendado)

**Opción A: Usar dominio de prueba de Resend (más rápido)**
- Puedes enviar emails desde `onboarding@resend.dev`
- Limitación: solo a emails que hayas verificado en Resend
- Perfecto para testing

**Opción B: Usar tu propio dominio (más profesional)**
1. En Resend, ve a **Domains**
2. Añade tu dominio (ej: `urbanguardian.com`)
3. Configura los registros DNS que te indique Resend
4. Espera verificación (5-30 minutos)
5. Podrás enviar desde `sos@urbanguardian.com`

### 4. Configurar Variables de Entorno

Crea el archivo `functions/.env` con este contenido:

```env
RESEND_API_KEY=re_tu_api_key_aqui
FROM_EMAIL=UrbanGuardian <onboarding@resend.dev>
TRACKING_URL=https://vzalabardo.github.io/urbanguardian/track
```

**Nota:** Si configuraste tu dominio, cambia `FROM_EMAIL` a:
```env
FROM_EMAIL=UrbanGuardian <sos@tudominio.com>
```

### 5. Instalar Dependencias

```bash
cd functions
npm install
```

### 6. Desplegar Cloud Functions

```bash
# Desde la raíz del proyecto (urbanguardian/)
firebase deploy --only functions
```

---

## 📧 Formato de Emails

### Email de Activación SOS

**Asunto:** `⚠️ ALERTA SOS - [Nombre Usuario]`

**Contenido:**
- Header rojo con "⚠️ ALERTA SOS"
- Mensaje: "[Usuario] ha activado una alerta de emergencia"
- Botón grande: "Ver Ubicación en Tiempo Real"
- Link alternativo para copiar/pegar
- Footer con branding UrbanGuardian

### Email de Desactivación (PIN Real)

**Asunto:** `✅ Alerta desactivada - [Nombre Usuario]`

**Contenido:**
- Header verde con "✅ Alerta Desactivada"
- Mensaje: "La situación de emergencia ha sido resuelta"

### Email de Desactivación (PIN Falso)

**Asunto:** `⚠️ ALERTA - Posible coacción - [Nombre Usuario]`

**Contenido:**
- Header naranja con "⚠️ ALERTA - Posible Coacción"
- Advertencia: "Podría estar bajo amenaza o coacción"
- Botón: "Ver Ubicación"

---

## 👥 Configurar Contactos de Confianza

**IMPORTANTE:** Los contactos ahora necesitan **email** en lugar de teléfono.

### En la App

1. Ve a **Perfil** → **Contactos de emergencia**
2. Añade contactos con:
   - **Nombre:** "Mamá"
   - **Email:** `mama@gmail.com` (en lugar de teléfono)

### Formato en Firestore

```javascript
trustedContacts: [
  { name: "Mamá", email: "mama@gmail.com" },
  { name: "Carlos", email: "carlos@hotmail.com" }
]
```

**Nota:** Si ya tienes contactos con `phone`, necesitas actualizarlos para agregar `email`.

---

## 💰 Costes

### Resend (Email)
- **Tier gratuito**: 3000 emails/mes, 100 emails/día
- **Ejemplo**: 100 SOS/mes × 3 contactos = 300 emails/mes → **€0**
- **Si superas el límite**: $20/mes por 50,000 emails adicionales

### Firebase
- **Cloud Functions**: 2M invocaciones/mes gratis → **$0**
- **Firestore**: tier gratuito → **$0**
- **Hosting**: GitHub Pages → **$0**

**Total estimado: €0/mes** 🎉

---

## 🧪 Probar el Sistema

### 1. Configurar Contactos de Prueba

Añade tu propio email como contacto de confianza para testing:
```javascript
{ name: "Yo (Test)", email: "tuemail@gmail.com" }
```

### 2. Activar SOS desde la App

1. Abre la app en el móvil/navegador
2. Pulsa el botón SOS (mantén presionado 1.5s)
3. Verifica que se crea el documento en Firestore

### 3. Verificar Email

1. Revisa tu bandeja de entrada
2. Deberías recibir email con asunto "⚠️ ALERTA SOS - [Tu Nombre]"
3. Haz clic en el botón "Ver Ubicación en Tiempo Real"
4. Verifica que la página de tracking carga correctamente

### 4. Probar Desactivación

1. Introduce PIN real → deberías recibir email "✅ Alerta desactivada"
2. Activa SOS de nuevo
3. Introduce PIN falso → deberías recibir email "⚠️ Posible coacción"

---

## 🔧 Troubleshooting

### Los emails no llegan

1. **Verifica logs de Cloud Functions:**
   ```bash
   firebase functions:log
   ```

2. **Verifica que la API key sea correcta:**
   - Ve a Resend dashboard → API Keys
   - Asegúrate de copiar la key completa (empieza con `re_`)

3. **Revisa spam/promociones:**
   - Los emails podrían estar en spam la primera vez
   - Marca como "No es spam" para futuros emails

4. **Verifica límites de Resend:**
   - Dashboard → Usage
   - Asegúrate de no haber superado 100 emails/día

### Los contactos no tienen email

1. Ve a la app → Perfil → Contactos de emergencia
2. Edita cada contacto y agrega email
3. Formato: `nombre@dominio.com`

### Error "Domain not verified"

Si usas tu propio dominio:
1. Ve a Resend → Domains
2. Verifica que todos los registros DNS estén configurados
3. Espera a que el estado sea "Verified"
4. Mientras tanto, usa `onboarding@resend.dev`

---

## 📋 Checklist de Deployment

- [ ] Cuenta Resend creada
- [ ] API Key obtenida
- [ ] Variables en `functions/.env` configuradas
- [ ] (Opcional) Dominio verificado en Resend
- [ ] `npm install` ejecutado en `/functions`
- [ ] Cloud Functions desplegadas
- [ ] Contactos de confianza tienen **email** (no teléfono)
- [ ] Prueba real enviada y recibida

---

## 🎯 Próximas Mejoras

- [ ] **Migrar a WhatsApp** cuando tengas tracción (gratis hasta 1000 msgs/mes)
- [ ] Notificaciones push además de email
- [ ] Opción de SMS como backup (para contactos sin email)
- [ ] Templates de email personalizables
- [ ] Historial de emails enviados en el perfil

---

## 🔄 Migración Futura a WhatsApp

Cuando quieras migrar a WhatsApp (más urgente que email):

1. Compra SIM prepago física (€10)
2. Verifica WhatsApp Business en Meta
3. Cambia la Cloud Function para usar WhatsApp Cloud API
4. Actualiza contactos para incluir `phone` además de `email`

**Ventaja:** WhatsApp es gratis hasta 1000 conversaciones/mes y más urgente que email.

---

## 📞 Soporte

Si tienes problemas:
1. **Logs de Functions:** `firebase functions:log`
2. **Dashboard de Resend:** [resend.com/emails](https://resend.com/emails)
3. **Consola de Firebase:** [console.firebase.google.com](https://console.firebase.google.com/)

---

## 🎨 Personalizar Templates de Email

Los templates HTML están en `functions/index.js`. Puedes modificar:
- Colores (variables CSS en el `<style>`)
- Textos de los mensajes
- Estructura del email
- Agregar logo de UrbanGuardian

Ejemplo para agregar logo:
```html
<div class="header">
  <img src="https://tudominio.com/logo.png" alt="UrbanGuardian" style="max-width: 150px;">
  <h1>⚠️ ALERTA SOS</h1>
</div>
```
