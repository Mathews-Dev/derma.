import { initializeApp, getApps } from 'firebase-admin/app';

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
