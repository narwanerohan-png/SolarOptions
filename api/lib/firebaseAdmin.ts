import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Safely handle newlines in private key
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

let adminApp: App | null = null;

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
  }
} else {
  console.warn(
    "[Firebase Admin Warning] Missing service account environment variables. " +
    "Firebase Admin SDK will not be initialized. Routes requiring token verification will fail."
  );
}

// Custom request interface to include decoded user
export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Gets the Firebase Admin Auth instance.
 */
export function getAdminAuth() {
  if (!adminApp) {
    throw new Error("Firebase Admin SDK is not initialized.");
  }
  return getAuth(adminApp);
}

let adminDb: any = null;

/**
 * Gets the Firebase Admin Firestore instance.
 */
export function getAdminDb() {
  if (!adminDb) {
    if (!adminApp) {
      throw new Error("Firebase Admin SDK is not initialized.");
    }
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
      adminDb = getFirestore(adminApp, dbId);
      console.log(`[Firebase Admin Db] Successfully initialized Firestore with database ID: ${dbId}`);
    } else {
      adminDb = getFirestore(adminApp);
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

  if (!adminApp) {
    console.error("[Firebase Admin Error] Cannot verify token: Firebase Admin app is not initialized.");
    res.status(500).json({ error: "Internal Server Error: Auth service unavailable" });
    return;
  }

  try {
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error("[Firebase Admin Error] Token verification failed:", error.message);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
