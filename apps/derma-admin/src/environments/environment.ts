import { AppEnvironment } from '@derma/models';

export const environment: AppEnvironment = {
  production: true,
  firebase: {
    apiKey: "AIzaSyD20oyChU2vAuKhH4XSaUnkXgydMQgL93A",
    authDomain: "derma-7da60.firebaseapp.com",
    projectId: "derma-7da60",
    storageBucket: "derma-7da60.firebasestorage.app",
    messagingSenderId: "1079698773662",
    appId: "1:1079698773662:web:d7443d80b9354391180d8f"
  },
  whatsappApiUrl: 'https://api.derma.com/whatsapp',
  mercadoPagoApiUrl: 'https://api.derma.com/mercadopago',
  cloudinary: {
    cloudName: 'mrpotato',
    uploadPreset: 'mr_myupload'
  },
  whatsappNumber: '5493885405345'
};
