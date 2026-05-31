import { initializeApp, getApps } from 'firebase-admin/app';

/**
 * Initializes Firebase Admin SDK with environment credentials or default credentials (for Cloud Functions)
 */
export function initFirebaseAdmin(): void {
  if (getApps().length > 0) return;
  
  if (process.env['FIREBASE_PROJECT_ID']) {
    const { cert } = require('firebase-admin/app');
    initializeApp({
      credential: cert({
        projectId:   process.env['FIREBASE_PROJECT_ID'],
        clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
        privateKey:  process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    initializeApp();
  }
}
