import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

// Configuration for Firebase Admin SDK
export class FirebaseConfig {
  private static app: admin.app.App;

  static initialize() {
    if (!this.app) {
      // Try environment variables first
      if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          } as ServiceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
      } else {
        // Fallback to service account file
        try {
          throw new Error('Service account file loading not implemented');
        } catch {
          console.error(
            'Service account file not found. Please add serviceAccountKey.json or use environment variables.',
          );
          throw new Error('Firebase configuration failed. Check your credentials.');
        }
      }
    }
    return this.app;
  }

  static getApp(): admin.app.App {
    if (!this.app) {
      return this.initialize();
    }
    return this.app;
  }

  static getFirestore(): admin.firestore.Firestore {
    return this.getApp().firestore();
  }

  static getAuth(): admin.auth.Auth {
    return this.getApp().auth();
  }
}
