// ============================================================
//  Urban Guardian — Cloud Functions
//  Responsibility: SOS Email notifications via Resend
//  WARNING: API key hardcoded for MVP demo - CHANGE BEFORE PRODUCTION
// ============================================================

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';

initializeApp();
const db = getFirestore();

// ── Resend client ─────────────────────────────────────────
// TEMPORAL MVP - API key hardcoded (will be deleted after demo)
const resend = new Resend('re_hZNGtniq_BsRHWovGJuFkEP75byhRx28m');
const FROM_EMAIL = 'UrbanGuardian <onboarding@resend.dev>';
const TRACKING_URL = 'https://vzalabardo.github.io/urbanguardian/app/track';

// ── Helper: Send Email ────────────────────────────────────
async function sendEmail(to, subject, htmlContent) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: htmlContent
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

// ── Trigger: SOS Alert Created ────────────────────────────
export const onSOSCreated = onDocumentCreated('sos_alerts/{alertId}', async (event) => {
  const alertId = event.params.alertId;
  const alertData = event.data.data();
  
  console.log(`SOS Alert created: ${alertId}`);
  
  // Get user profile to fetch trusted contacts
  const userId = alertData.userId;
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    console.error(`User ${userId} not found`);
    return;
  }
  
  const userData = userDoc.data();
  const userName = userData.displayName || 'Un usuario';
  const trustedContacts = userData.trustedContacts || [];
  
  if (trustedContacts.length === 0) {
    console.log('No trusted contacts to notify');
    return;
  }
  
  // Build tracking link
  const trackingLink = `${TRACKING_URL}?id=${alertId}`;
  
  // Email HTML template for SOS activation
  const emailSubject = `⚠️ ALERTA SOS - ${userName}`;
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #ef4444; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .btn { display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ ALERTA SOS</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>${userName}</strong> ha activado una alerta de emergencia.
          </div>
          <p>Tu contacto de confianza necesita ayuda urgente. Puedes ver su ubicación en tiempo real haciendo clic en el siguiente enlace:</p>
          <center>
            <a href="${trackingLink}" class="btn">Ver Ubicación en Tiempo Real</a>
          </center>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">O copia este enlace en tu navegador:<br><a href="${trackingLink}">${trackingLink}</a></p>
        </div>
        <div class="footer">
          <strong>UrbanGuardian</strong><br>
          Sistema de alertas de emergencia
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Send email to each contact
  const notifiedContacts = [];
  for (const contact of trustedContacts) {
    if (contact.email && contact.email.trim()) {
      const success = await sendEmail(contact.email, emailSubject, emailHTML);
      if (success) {
        notifiedContacts.push({
          name: contact.name,
          email: contact.email,
          notifiedAt: new Date().toISOString()
        });
      }
    }
  }
  
  // Update alert document with notification status
  await db.collection('sos_alerts').doc(alertId).update({
    notifiedContacts: notifiedContacts,
    emailNotificationsSent: notifiedContacts.length,
    lastNotificationAt: new Date().toISOString()
  });
  
  console.log(`Notified ${notifiedContacts.length} contacts for alert ${alertId}`);
});

// ── Trigger: SOS Alert Updated (Deactivation) ─────────────
export const onSOSUpdated = onDocumentUpdated('sos_alerts/{alertId}', async (event) => {
  const alertId = event.params.alertId;
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  
  // Check if status changed to deactivated
  if (beforeData.status === 'active' && afterData.status === 'deactivated') {
    console.log(`SOS Alert deactivated: ${alertId}, type: ${afterData.deactivationType}`);
    
    // Get user profile
    const userId = afterData.userId;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error(`User ${userId} not found`);
      return;
    }
    
    const userData = userDoc.data();
    const userName = userData.displayName || 'Un usuario';
    const trustedContacts = userData.trustedContacts || [];
    
    if (trustedContacts.length === 0) {
      console.log('No trusted contacts to notify about deactivation');
      return;
    }
    
    // Build tracking link
    const trackingLink = `${TRACKING_URL}?id=${alertId}`;
    
    // Different email templates based on deactivation type
    let emailSubject, emailHTML;
    
    if (afterData.deactivationType === 'fake_pin') {
      // Fake PIN: user might be under duress
      emailSubject = `⚠️ ALERTA - Posible coacción - ${userName}`;
      emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: #f59e0b; color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ ALERTA - Posible Coacción</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>${userName}</strong> ha desactivado la alerta SOS usando el PIN de coacción.
              </div>
              <p><strong>Esto podría indicar que está bajo amenaza o coacción.</strong></p>
              <p>La ubicación sigue disponible para seguimiento:</p>
              <center>
                <a href="${trackingLink}" class="btn">Ver Ubicación</a>
              </center>
            </div>
            <div class="footer">
              <strong>UrbanGuardian</strong><br>
              Sistema de alertas de emergencia
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Real PIN or timeout: normal deactivation
      emailSubject = `✅ Alerta desactivada - ${userName}`;
      emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: #10b981; color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .alert-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Alerta Desactivada</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>${userName}</strong> ha desactivado la alerta SOS de forma segura.
              </div>
              <p>La situación de emergencia ha sido resuelta.</p>
            </div>
            <div class="footer">
              <strong>UrbanGuardian</strong><br>
              Sistema de alertas de emergencia
            </div>
          </div>
        </body>
        </html>
      `;
    }
    
    // Send email to each contact
    for (const contact of trustedContacts) {
      if (contact.email && contact.email.trim()) {
        await sendEmail(contact.email, emailSubject, emailHTML);
      }
    }
    
    console.log(`Sent deactivation notifications for alert ${alertId}`);
  }
});
