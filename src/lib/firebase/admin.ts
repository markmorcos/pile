import * as admin from "firebase-admin";

let adminAuth: admin.auth.Auth | null = null;
let adminApp: admin.app.App | null = null;

function initializeFirebaseAdmin() {
  if (adminApp) {
    return { adminAuth: adminAuth!, adminApp };
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  if (!admin.apps.length) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } else {
    adminApp = admin.app();
  }

  adminAuth = admin.auth();

  return { adminAuth, adminApp };
}

export function getAdminAuth() {
  const { adminAuth } = initializeFirebaseAdmin();
  return adminAuth;
}

export function getAdminApp() {
  const { adminApp } = initializeFirebaseAdmin();
  return adminApp;
}

// For backward compatibility
export { getAdminAuth as adminAuth, getAdminApp as adminApp };
