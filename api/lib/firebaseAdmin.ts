import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

let adminApp: App | null = null;

/**
 * Dynamically gets or initializes the Firebase Admin App instance.
 * Ensures any environment variables (e.g. set by dotenv) are read at execution time.
 */
export function getAdminApp(): App {
  if (!adminApp) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      // Handle potential quote wrapping in environment configurations
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
      }
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (projectId && clientEmail && privateKey) {
      try {
        const apps = getApps();
        if (apps.length === 0) {
          adminApp = initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
          console.log("[Firebase Admin] Successfully initialized with service account.");
        } else {
          adminApp = apps[0]!;
          console.log("[Firebase Admin] Reused existing Firebase Admin instance.");
        }
      } catch (error: any) {
        console.error("[Firebase Admin Error] Failed to initialize Firebase Admin SDK:", error.message);
        throw error;
      }
    } else {
      const missing = [];
      if (!projectId) missing.push("FIREBASE_PROJECT_ID");
      if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
      if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");

      const errMsg = `Firebase Admin SDK is not initialized. Missing environment variables: ${missing.join(", ")}`;
      console.error(`[Firebase Admin Error] ${errMsg}`);
      throw new Error(errMsg);
    }
  }
  return adminApp;
}

// Custom request interface to include decoded user
export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Gets the Firebase Admin Auth instance.
 */
export function getAdminAuth() {
  return getAuth(getAdminApp());
}

let adminDb: any = null;

/**
 * Gets the Firebase Admin Firestore instance.
 */
export function getAdminDb() {
  if (!adminDb) {
    const app = getAdminApp();
    let dbId: string | undefined = undefined;
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        dbId = config.firestoreDatabaseId;
      }
    } catch (e: any) {
      console.warn("[Firebase Admin Warning] Could not load firebase-applet-config.json for database ID:", e.message);
    }

    if (dbId) {
      adminDb = getFirestore(app, dbId);
      console.log(`[Firebase Admin Db] Successfully initialized Firestore with database ID: ${dbId}`);
    } else {
      adminDb = getFirestore(app);
      console.log("[Firebase Admin Db] Successfully initialized Firestore with default database.");
    }
  }
  return adminDb;
}

/**
 * Reusable Express middleware to verify Firebase ID tokens (JWTs) in the Authorization header.
 * Attaches the decoded token to `req.user`.
 */
export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Token empty" });
    return;
  }

  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error("[Firebase Admin Error] Token verification failed:", error.message);
    res.status(401).json({ error: `Unauthorized: Invalid or expired token. ${error.message}` });
  }
}
