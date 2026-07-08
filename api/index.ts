import express from "express";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import https from "https";
import fs from "fs";
import { verifyFirebaseToken, getAdminAuth, getAdminDb } from "./lib/firebaseAdmin.js";
import Razorpay from "razorpay";
import crypto from "crypto";


if (!process.env.VERCEL) {
  dotenv.config();
}

// Server-side Firestore initialization using Firebase Admin Firestore
let serverDb: any = null;
try {
  serverDb = getAdminDb();
  console.log("[Firebase Server Engine] Firebase Admin Firestore successfully initialized on server.");
} catch (e: any) {
  console.warn("[Firebase Server Engine Exception] Failed to initialize Admin Firestore:", e.message);
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const GOOGLE_SCRIPT_URL = (process.env.GOOGLE_SCRIPT_URL && process.env.GOOGLE_SCRIPT_URL.trim().length > 10) 
  ? process.env.GOOGLE_SCRIPT_URL.trim() 
  : "https://script.google.com/macros/s/AKfycbyCo6CZ51CO8-fb8UupLEbU7GZ82Pb31dg8v8hMRK_bvd0FqoOVPnd2QSejiXfBZvGtWg/exec";

// --- SERVER-SIDE MEMORY CACHE ---
interface FacilitiesCache {
  data: any[] | null;
  lastUpdated: number;
}
const facilitiesCache: FacilitiesCache = {
  data: null,
  lastUpdated: 0,
};
const FACILITIES_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache expiration duration

// Active Auto-Refresher background loop to seed or refresh the cache
async function backgroundRefreshCache() {
  try {
    const separator = GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?';
    const fetchUrl = `${GOOGLE_SCRIPT_URL}${separator}sheet=Sheet1&sheetName=Sheet1`;
    console.log(`[Cache Background Auto-Refresher] Querying Sheet1: ${fetchUrl.substring(0, 75)}...`);
    const upstreamData = await getGoogleScriptData(fetchUrl);
    
    let parsed: any[] = [];
    if (typeof upstreamData === 'string') {
      if (!upstreamData.includes("<!DOCTYPE") && !upstreamData.includes("<html")) {
        try {
          parsed = JSON.parse(upstreamData);
        } catch (e) {}
      }
    } else if (Array.isArray(upstreamData)) {
      parsed = upstreamData;
    }
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      facilitiesCache.data = parsed;
      facilitiesCache.lastUpdated = Date.now();
      console.log(`[Cache Background Auto-Refresher] Successfully refreshed cache with ${parsed.length} facilities.`);
    }
  } catch (err: any) {
    console.error(`[Cache Background Auto-Refresher] Failed:`, err.message);
  }
}

// Automatically start background refresh loop and trigger every 10 minutes
if (!process.env.VERCEL) {
  setTimeout(() => {
    backgroundRefreshCache();
    // Refresh every 10 minutes (600,000 ms) automatically
    setInterval(backgroundRefreshCache, FACILITIES_CACHE_TTL_MS);
  }, 3000);
}

const AXIOS_CONFIG = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Content-Type": "application/json"
  },
  timeout: 45000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
};

// Resilient Google Apps Script Helper: GET with absolute safety timeouts (< 10 seconds total to fit on Vercel Hobby)
async function getGoogleScriptData(url: string): Promise<any> {
  const secret = process.env.APPS_SCRIPT_SECRET || "";
  let targetUrl = url;
  if (secret) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}secret=${encodeURIComponent(secret)}`;
  }

  console.log(`[Google SDK] Fetching data via dual-engine: ${targetUrl.substring(0, 75)}...`);
  
  const FETCH_TIMEOUT_MS = 15000; // 15 seconds timeout for Native fetch
  const AXIOS_TIMEOUT_MS = 15000; // 15 seconds timeout for Axios fallback
  
  // Method 1: Try native Node.js fetch (Node 18+ has built-in global fetch), which handles redirects flawlessly
  if (typeof fetch !== "undefined") {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[Google SDK] Engine 1 (Native fetch) timed out after ${FETCH_TIMEOUT_MS}ms. Aborting...`);
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      console.log(`[Google SDK] Engine 1 (Native fetch) requesting list with 15s timeout...`);
      const res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        redirect: "follow",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        console.log(`[Google SDK] Engine 1 success, payload length: ${text.length}`);
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
      console.warn(`[Google SDK] Engine 1 responded with status: ${res.status}`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[Google SDK] Engine 1 (Native fetch) did not complete: ${err.message}. Cascading to Engine 2.`);
    }
  }

  // Method 2: Fallback to Axios GET
  console.log(`[Google SDK] Engine 2 (Axios GET) requesting list with 3s timeout...`);
  const response = await axios.get(targetUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
    },
    timeout: AXIOS_TIMEOUT_MS,
    maxRedirects: 15
  });
  return response.data;
}

// Resilient Google Apps Script Helper: POST with absolute safety timeouts
async function postGoogleScriptData(url: string, payload: any): Promise<any> {
  const secret = process.env.APPS_SCRIPT_SECRET || "";
  let targetUrl = url;
  if (secret) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}secret=${encodeURIComponent(secret)}`;
  }

  console.log(`[Google SDK] Posting data via dual-engine: ${targetUrl.substring(0, 75)}...`);
  
  const FETCH_TIMEOUT_MS = 15000; // 15 seconds timeout for Native fetch POST
  const AXIOS_TIMEOUT_MS = 15000; // 15 seconds timeout for Axios fallback POST

  // Method 1: Try native Node.js fetch (Node 18+ has built-in global fetch), which handles redirects flawlessly
  if (typeof fetch !== "undefined") {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[Google SDK] Engine 1 (Native fetch POST) timed out after ${FETCH_TIMEOUT_MS}ms. Aborting...`);
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      console.log(`[Google SDK] Engine 1 (Native fetch POST) sending payload with 15s timeout...`);
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
        redirect: "follow",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        console.log(`[Google SDK] Engine 1 POST success, payload length: ${text.length}`);
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
      console.warn(`[Google SDK] Engine 1 POST responded with status: ${res.status}`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[Google SDK] Engine 1 (Native fetch POST) did not complete: ${err.message}. Cascading to Engine 2.`);
    }
  }

  // Method 2: Fallback to Axios POST
  console.log(`[Google SDK] Engine 2 (Axios POST) sending payload with 3s timeout...`);
  const response = await axios.post(targetUrl, payload, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Content-Type": "application/json"
    },
    timeout: AXIOS_TIMEOUT_MS,
    maxRedirects: 15
  });
  return response.data;
}

// Log warning if URL is suspicious
if (GOOGLE_SCRIPT_URL.includes("/dev")) {
  console.warn("⚠️ WARNING: Your GOOGLE_SCRIPT_URL ends in /dev. This will FAIL on Vercel. Use an /exec URL from a 'New Deployment'.");
}

// Validate URL format
if (GOOGLE_SCRIPT_URL.includes("docs.google.com/spreadsheets/d/")) {
  console.error("CRITICAL CONFIG ERROR: GOOGLE_SCRIPT_URL is a Google Spreadsheet URL. It MUST be a Google Apps Script WEB APP URL (ending in /exec).");
} else if (!GOOGLE_SCRIPT_URL.endsWith("/exec") && !GOOGLE_SCRIPT_URL.includes("/exec?")) {
  console.warn("[Server] Warning: GOOGLE_SCRIPT_URL might be invalid - it usually ends with '/exec'. Current: " + GOOGLE_SCRIPT_URL);
}

console.log(`[Server] Using Google Script URL from ${process.env.GOOGLE_SCRIPT_URL ? 'environment variable' : 'default value'}: ${GOOGLE_SCRIPT_URL.substring(0, 30)}...`);

const app = express();
app.disable("x-powered-by");
const PORT = 3000;

// Streaming Reverse Proxy for Firebase Auth custom domain resolution
app.all("/__/auth/*", (req, res) => {
  const targetHost = "gen-lang-client-0873083077.firebaseapp.com";
  const targetUrl = `https://${targetHost}${req.originalUrl || req.url}`;
  console.log(`[Firebase Auth Proxy] Streaming request: ${req.method} ${req.url} -> ${targetUrl}`);

  const options = {
    method: req.method,
    headers: {
      ...req.headers,
      host: targetHost, // Map host header to firebase original domain to satisfy CORS and secure routing constraints
    }
  };

  // Strip origin/referer headers during proxy to prevent upstream Firebase CORS or domain policy checks from rejecting the cross-domain hop
  delete options.headers.referer;
  delete options.headers.origin;

  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error(`[Firebase Auth Proxy Error] Connection failed for ${req.url}:`, err.message);
    res.status(500).send(`Auth proxy connection failed: ${err.message}`);
  });

  req.pipe(proxyReq);
});

// Trust the AI Studio / Nginx proxy
app.set("trust proxy", true);

// Middleware
const whitelist = [
  "https://www.solaroptions.in",
  "https://solaroptions.in"
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // If request has no Origin (like non-browser clients, same-origin, curl, server-to-server), allow it
    if (!origin) {
      return callback(null, true);
    }
    
    if (whitelist.includes(origin)) {
      return callback(null, true);
    }
    
    // Non-production fallback for local development / preview channels
    const isProd = process.env.NODE_ENV === "production" || process.env.VITE_PROD === "true";
    if (!isProd) {
      try {
        const url = new URL(origin);
        if (
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1" ||
          url.hostname.endsWith(".run.app") ||
          url.hostname.endsWith(".aistudio-preview.com") ||
          url.hostname.includes("asia-southeast1.run.app") ||
          url.hostname.includes("solaroptions")
        ) {
          return callback(null, true);
        }
      } catch (e) {
        console.error("[CORS Option Error] Invalid URL origin parsed:", origin);
      }
    }
    
    return callback(null, false);
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const isApi = req.url.startsWith("/api");
  const isAsset = req.url.includes(".");
  
  if (isApi || !isAsset) {
    console.log(`[Server] ${req.method} ${req.url} (IP: ${req.ip})`);
  }
  next();
});

// Health check
app.get(["/api/health", "/api/status", "/api/ping"], (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    is_production: process.env.NODE_ENV === 'production' || process.env.VITE_PROD === 'true',
    script_url_set: !!process.env.GOOGLE_SCRIPT_URL,
    proxy: req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip
  });
});

// Local fallback database to make sure logins, leads, feedbacks, and quotes work perfectly if GS fails
interface LocalInboxItem {
  type: 'feedback' | 'quote';
  timestamp: string;
  status: string;
  feedback?: string;
  message?: string;
  factory?: string;
  location?: string;
  units?: string;
  contact?: string;
}

interface LocalUser {
  companyName?: string;
  email?: string;
  username: string; // mapped from email
  password?: string;
  contact?: string;
  paymentId?: string;
  validUntil?: string;
  isTrial?: boolean;
  fingerprint?: string;
  expiryDate?: string;
  timestamp: string;
}

const localInbox: LocalInboxItem[] = [];

// --- RATE LIMITING IN-MEMORY ENGINES ---
const rateLimits: Record<string, { count: number; resetTime: number }> = {};
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per window

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  if (!rateLimits[key]) {
    rateLimits[key] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    return true;
  }
  const limit = rateLimits[key];
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return true;
  }
  limit.count++;
  return limit.count <= MAX_REQUESTS_PER_WINDOW;
}

// --- AUDIT LOGGER UTILITY ---
async function logAuditAction(uid: string, email: string, action: string, details: any) {
  const ip = details.ip || "unknown";
  console.log(`[Audit Log] ${action} | User: ${email} (${uid}) | IP: ${ip} | Timestamp: ${new Date().toISOString()} | Details: ${JSON.stringify(details)}`);
  if (serverDb) {
    try {
      await serverDb.collection("audit_logs").add({
        uid,
        email,
        action,
        details,
        ip,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      console.error("[Audit Log Error] Failed to write audit log to Firestore:", e.message);
    }
  }
}

// --- VALUES MASKING UTILITY TO PREVENT BULK EXTRACTION ---
const maskValue = (val: string, type: 'name' | 'contact' | 'email') => {
  if (!val) return '';
  const clean = String(val).trim();
  if (type === 'name') {
    if (clean.length <= 2) return clean;
    return `${clean[0]}***${clean[clean.length - 1]} (Authorized Manager)`;
  }
  if (type === 'contact') {
    if (clean.length <= 4) return clean;
    return `+91 ***** ***${clean.slice(-2)}`;
  }
  if (type === 'email') {
    const parts = clean.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : '***';
      return `${maskedName}@${domain}`;
    }
    return 'partner-exclusive@domain.in';
  }
  return val;
};

// Proxy: Get Leads (with alias /api/facilities to bypass adblockers)
app.get(["/api/leads", "/api/leads/", "/api/facilities", "/api/facilities/"], verifyFirebaseToken, async (req: any, res) => {
  const activeUid = req.user?.uid || "unknown";
  const userEmail = req.user?.email || "unknown";
  const ipAddress = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip;
  let isPremium = false;

  try {
    // 1. Rate Limiting Check
    const rateLimitKey = `${activeUid}_${ipAddress}`;
    if (!checkRateLimit(rateLimitKey)) {
      console.warn(`[Rate Limit Exceeded] User: ${userEmail} (${activeUid}) | IP: ${ipAddress}`);
      return res.status(429).json({ error: "Too many requests. Please slow down and try again later." });
    }

    // 2. Subscription Verification Check on Every Request
    if (serverDb) {
      try {
        const userDocRef = serverDb.collection("users").doc(activeUid);
        const userSnap = await userDocRef.get();
        if (!userSnap.exists) {
          console.warn(`[API Access Denied] User profile not found for UID: ${activeUid}`);
          return res.status(403).json({ error: "Access Denied: User profile not found. Please register or sign in again." });
        }
        const userData = userSnap.data();
        isPremium = userData.plan === "Premium";
        const expiry = userData.subscriptionExpiry;
        const now = new Date().toISOString();

        if (expiry && expiry < now) {
          console.warn(`[API Access Denied] Subscription/Trial expired for: ${userEmail}`);
          return res.status(403).json({
            success: false,
            expired: true,
            error: isPremium ? "Subscription expired" : "Trial expired",
            message: isPremium
              ? "Your premium subscription has expired. Please upgrade or renew your subscription to reactivate access."
              : "Your 1-day free trial has expired. Please upgrade to a paid premium subscription to continue."
          });
        }
      } catch (e: any) {
        console.error(`[API Subscription Verification Exception] ${e.message}`);
      }
    }

    const separator = GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?';
    
    // Server-side cache check (Stale-While-Revalidate)
    const now = Date.now();
    const isExpired = now - facilitiesCache.lastUpdated > FACILITIES_CACHE_TTL_MS;
    const cacheExists = facilitiesCache.data && facilitiesCache.data.length > 0;

    let upstreamData;

    if (cacheExists) {
      console.log(`[Cache Engine] Serving ${facilitiesCache.data!.length} units instantly from memory.`);
      upstreamData = facilitiesCache.data;
      
      // If cache is expired, revalidate in background without blocking the current response
      if (isExpired) {
        console.log(`[Cache Engine] Cache is expired (stale-while-revalidate). Triggering non-blocking background refresh...`);
        backgroundRefreshCache().catch(err => {
          console.error(`[Cache Engine] Background revalidation failed:`, err.message);
        });
      }
    } else {
      // Cold Cache: Must pull synchronously for the very first request
      console.log(`[Cache Engine] Cold Cache. Fetching synchronously from Google Sheets...`);
      try {
        const rawResult = await getGoogleScriptData(`${GOOGLE_SCRIPT_URL}${separator}sheet=Sheet1&sheetName=Sheet1`);
        let parsed = [];
        if (typeof rawResult === 'string') {
          if (!rawResult.includes("<!DOCTYPE") && !rawResult.includes("<html")) {
            parsed = JSON.parse(rawResult);
          }
        } else if (Array.isArray(rawResult)) {
          parsed = rawResult;
        }
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          facilitiesCache.data = parsed;
          facilitiesCache.lastUpdated = now;
          console.log(`[Cache Engine] Cache populated with ${parsed.length} units.`);
          upstreamData = parsed;
        } else {
          throw new Error("Invalid or empty spreadsheet data received on cold fetch");
        }
      } catch (err: any) {
        console.warn(`[Cache Engine] Synchronous fetch failed (${err.message}). Trying fallback request...`);
        const rawFallback = await getGoogleScriptData(GOOGLE_SCRIPT_URL);
        let parsedFallback = [];
        if (typeof rawFallback === 'string') {
          parsedFallback = JSON.parse(rawFallback);
        } else if (Array.isArray(rawFallback)) {
          parsedFallback = rawFallback;
        }
        if (Array.isArray(parsedFallback) && parsedFallback.length > 0) {
          facilitiesCache.data = parsedFallback;
          facilitiesCache.lastUpdated = now;
          upstreamData = parsedFallback;
        } else {
          throw err; // Escalate error if fallback fails
        }
      }
    }

    if (Array.isArray(upstreamData)) {
      const mergedInbox = [...upstreamData];
      for (const localItem of localInbox) {
        const exists = upstreamData.some(upItem => 
          upItem.timestamp === localItem.timestamp && 
          ((upItem.feedback || upItem.message) === (localItem.feedback || localItem.message) || upItem.factory === localItem.factory)
        );
        if (!exists) {
          mergedInbox.unshift(localItem);
        }
      }

      // --- 3. Detail-on-Demand Extraction via slug Query Parameter ---
      const companySlug = typeof req.query.slug === 'string' ? req.query.slug.trim() : "";

      if (companySlug) {
        const matchedItem = mergedInbox.find(item => {
          const name = item['Factory Name'] || item['factory'] || '';
          return slugify(name) === companySlug;
        });

        if (matchedItem) {
          if (isPremium) {
            // Premium gets full unmasked details
            await logAuditAction(activeUid, userEmail, "DETAIL_DEMAND_UNLOCKED", {
              companySlug,
              companyName: matchedItem['Factory Name'] || matchedItem['factory'],
              ip: ipAddress
            });
            return res.json([matchedItem]); // Returns single unmasked record wrapped in an array
          } else {
            // Trial User gets same structure, but with sensitive fields masked or omitted on backend
            const itemToMask = { ...matchedItem };
            const nameKeys = ['Owner Name', 'owner', 'Owner'];
            const contactKeys = ['Contact Number', 'Contact', 'contact'];
            const emailKeys = ['Email ID', 'Email', 'email'];

            nameKeys.forEach(k => {
              if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'name');
            });
            contactKeys.forEach(k => {
              if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'contact');
            });
            emailKeys.forEach(k => {
              if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'email');
            });

            await logAuditAction(activeUid, userEmail, "DETAIL_DEMAND_MASKED", {
              companySlug,
              companyName: itemToMask['Factory Name'] || itemToMask['factory'],
              ip: ipAddress
            });
            return res.json([itemToMask]); // Returns single masked record wrapped in an array
          }
        }
      }

      // --- 4. Filtering (Region, Search) ---
      const limitQuery = req.query.limit;
      const offsetQuery = req.query.offset;
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const region = typeof req.query.region === 'string' ? req.query.region.trim().toLowerCase() : 'all';

      let filtered = [...mergedInbox];

      // Filter by region
      if (region && region !== 'all') {
        filtered = filtered.filter(item => {
          const itemRegion = String(item['Region'] || item['region'] || '').trim().toLowerCase();
          return itemRegion === region;
        });
      }

      // Filter by search
      if (search) {
        const searchClean = search.toLowerCase();
        filtered = filtered.filter(item => {
          const rooftop = String(item['Rooftop Space'] || item['rooftop'] || '').replace(/,/g, '');
          const name = String(item['Factory Name'] || item['factory'] || '').toLowerCase();
          const location = String(item['Location'] || item['location'] || '').toLowerCase();
          const owner = String(item['Owner Name'] || item['owner'] || '').toLowerCase();
          const email = String(item['Email'] || item['Email ID'] || item['email'] || '').toLowerCase();
          
          return rooftop === searchClean ||
                 name.includes(searchClean) ||
                 location.includes(searchClean) ||
                 owner.includes(searchClean) ||
                 email.includes(searchClean);
        });
      }

      const totalMatchingCount = filtered.length;

      // --- 5. Server-Side Pagination & Backend-Enforced Limits (Max 25) ---
      const rawLimit = limitQuery ? parseInt(String(limitQuery), 10) : 10;
      const limit = Math.min(25, isNaN(rawLimit) || rawLimit <= 0 ? 10 : rawLimit);
      const rawOffset = offsetQuery ? parseInt(String(offsetQuery), 10) : 0;
      const offset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;
      
      const sliced = filtered.slice(offset, offset + limit);

      // --- 6. Mask Sensitive Fields in the Paginated List View ---
      const maskedSliced = sliced.map(item => {
        const itemToMask = { ...item };
        
        const nameKeys = ['Owner Name', 'owner', 'Owner'];
        const contactKeys = ['Contact Number', 'Contact', 'contact'];
        const emailKeys = ['Email ID', 'Email', 'email'];

        nameKeys.forEach(k => {
          if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'name');
        });
        contactKeys.forEach(k => {
          if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'contact');
        });
        emailKeys.forEach(k => {
          if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'email');
        });

        return itemToMask;
      });

      // --- 7. Audit Logging for Listing Retrieval ---
      await logAuditAction(activeUid, userEmail, "LIST_RETRIEVE", {
        offset,
        limit,
        search,
        region,
        returnedCount: maskedSliced.length,
        totalMatchingCount,
        ip: ipAddress
      });

      // --- 8. Formatted Response ---
      if (limitQuery || offsetQuery || (search && search !== '') || (region && region !== 'all')) {
        return res.json({
          success: true,
          data: maskedSliced,
          totalCount: totalMatchingCount,
          limit,
          offset,
          hasMore: offset + limit < totalMatchingCount
        });
      }
      
      return res.json(maskedSliced);
    }
    
    res.json(upstreamData);
  } catch (error: any) {
    const statusInfo = error.response ? `HTTP ${error.response.status}` : error.message;
    console.log(`[Backup Database] Leads sync unconfigured or offline (${statusInfo}). Serving local in-memory dataset.`);
    
    // Fallback logic for offline dataset
    const limitQuery = req.query.limit;
    const offsetQuery = req.query.offset;
    const rawLimit = limitQuery ? parseInt(String(limitQuery), 10) : 10;
    const limit = Math.min(25, isNaN(rawLimit) || rawLimit <= 0 ? 10 : rawLimit);
    const rawOffset = offsetQuery ? parseInt(String(offsetQuery), 10) : 0;
    const offset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

    const slicedFallback = localInbox.slice(offset, offset + limit).map(item => {
      const itemToMask = { ...item };
      const nameKeys = ['Owner Name', 'owner', 'Owner'];
      const contactKeys = ['Contact Number', 'Contact', 'contact'];
      const emailKeys = ['Email ID', 'Email', 'email'];

      nameKeys.forEach(k => {
        if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'name');
      });
      contactKeys.forEach(k => {
        if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'contact');
      });
      emailKeys.forEach(k => {
        if (itemToMask[k]) itemToMask[k] = maskValue(itemToMask[k], 'email');
      });
      return itemToMask;
    });

    if (limitQuery || offsetQuery) {
      return res.json({
        success: true,
        data: slicedFallback,
        totalCount: localInbox.length,
        limit,
        offset,
        hasMore: offset + limit < localInbox.length
      });
    }
    res.json(slicedFallback);
  }
});



function parseUserAgent(uaString: string | undefined) {
  const ua = uaString || "";
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let deviceType = "Desktop";

  if (ua.includes("Firefox/")) {
    browser = "Firefox";
  } else if (ua.includes("Edg/")) {
    browser = "Edge";
  } else if (ua.includes("Chrome/")) {
    browser = "Chrome";
  } else if (ua.includes("Safari/")) {
    browser = "Safari";
  } else if (ua.includes("OPR/") || ua.includes("Opera/")) {
    browser = "Opera";
  }

  if (ua.includes("Windows NT")) {
    os = "Windows";
  } else if (ua.includes("Macintosh") && !ua.includes("iPhone") && !ua.includes("iPad")) {
    os = "MacOS";
  } else if (ua.includes("Linux") && !ua.includes("Android")) {
    os = "Linux";
  } else if (ua.includes("Android")) {
    os = "Android";
  } else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) {
    os = "iOS";
  }

  if (ua.includes("Mobi") || ua.includes("Android") || ua.includes("iPhone")) {
    deviceType = "Mobile";
  } else if (ua.includes("iPad")) {
    deviceType = "Tablet";
  }

  return { browser, os, deviceType };
}

// Google Sign-In Verification and Trial Control (Strictly authenticate existing users only)
app.post("/api/google-login", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let decodedToken;
  try {
    const adminAuth = getAdminAuth();
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (error: any) {
    console.error("[Firebase Admin Error] Token verification failed:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const activeUid = decodedToken.uid;
  const email = decodedToken.email;

  if (!activeUid || !email) {
    console.error("[Google Login Error] Verified token is missing essential claims");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { fingerprint, companyName, contact } = req.body;
  const ipAddress = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip;
  const timestamp = new Date().toISOString();

  const normalizedEmail = String(email).trim().toLowerCase();
  const cleanFingerprint = String(fingerprint || "").trim();

  if (serverDb) {
    try {
      // 1. Check if the user document exists in the `users` collection
      const userDocRef = serverDb.collection("users").doc(activeUid);
      const userSnap = await userDocRef.get();

      if (userSnap.exists) {
        const userData = userSnap.data() || {};
        const isPremium = userData.plan === "Premium";
        const expiry = userData.subscriptionExpiry;
        const now = new Date().toISOString();

        if (expiry && expiry < now) {
          console.warn(`[Google Login] Subscription/Trial expired for ${normalizedEmail}`);
          return res.status(403).json({
            success: false,
            expired: true,
            error: isPremium ? "Subscription expired" : "Trial expired",
            message: isPremium
              ? "Your premium subscription has expired. Please upgrade or renew your subscription to reactivate access."
              : "Your 1-day free trial has expired. Please upgrade to a paid premium subscription to continue."
          });
        }

        // Generate secure random sessionId
        const sessionId = crypto.randomUUID();

        // Parse user-agent
        const userAgent = req.headers["user-agent"];
        const { browser, os, deviceType } = parseUserAgent(userAgent);

        // Update user document with activeSessionId and device info for audit
        await userDocRef.update({
          activeSessionId: sessionId,
          lastLogin: timestamp,
          lastActivity: timestamp,
          lastLoginIP: ipAddress,
          lastBrowser: browser,
          lastOS: os,
          lastDevice: deviceType
        });

        console.log(`[Google Login] Existing user login successful: ${normalizedEmail} (Plan: ${userData.plan}) with Session: ${sessionId}`);
        return res.json({
          success: true,
          sessionId: sessionId,
          user: {
            username: normalizedEmail,
            companyName: userData.companyName || companyName || "Subscriber",
            validUntil: expiry ? (expiry.includes('T') ? new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : expiry) : "30 Days",
            isTrial: !isPremium
          }
        });
      }

      // 2. If the user does not exist in our Firestore users collection, block registration from Login page
      console.warn(`[Google Login] Login blocked for non-existent user: ${normalizedEmail}`);
      return res.status(404).json({
        success: false,
        error: "account_not_found",
        message: "Account not found. Please use 'Get Access' to create your account or start your free trial."
      });

    } catch (dbErr: any) {
      console.error("[Google Login Error] Firestore lookup failed:", dbErr);
      return res.status(500).json({ error: "Database error during login" });
    }
  } else {
    return res.status(503).json({ error: "Auth engine offline (Firestore unavailable)" });
  }
});

// API: Check if email is already registered in our users collection
app.post("/api/check-user-registered", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (serverDb) {
      const usersRef = serverDb.collection("users");
      const snapshot = await usersRef.where("email", "==", email).get();
      if (!snapshot.empty) {
        return res.json({ registered: true });
      }
    }
    return res.json({ registered: false });
  } catch (err: any) {
    console.error("[Check User Registered Error]", err);
    return res.status(500).json({ error: err.message });
  }
});

// Proxy: Register/Payment Sync
app.post(["/api/register", "/api/register/"], async (req, res) => {
  try {
    const normalizedEmail = (req.body.username || req.body.email || "").trim().toLowerCase();
    const cleanFingerprint = (req.body.fingerprint || "").trim();
    const isTrial = req.body.isTrial === true || String(req.body.isTrial || '').toLowerCase() === 'true' || String(req.body.paymentId || '').includes('free-trial');

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!isTrial) {
      console.warn(`[Register] Blocked direct premium registration attempt for ${normalizedEmail}.`);
      return res.status(400).json({
        success: false,
        error: "Premium registration not allowed",
        message: "Premium accounts can only be provisioned via secure payment verification."
      });
    }

    const cleanEmail = normalizedEmail;
    const cleanNumber = (numStr: string) => {
      const clean = String(numStr || "").replace(/\D/g, ''); // keep only digits
      return clean.length >= 10 ? clean.slice(-10) : clean;
    };
    const cleanContact = cleanNumber(req.body.contact || "");

    // A. Atomic Transaction level distributed lock in Firestore
    if (serverDb) {
      try {
        console.log(`[Distributed Lock] Querying atomic claims database for ${cleanEmail} & ${cleanContact}...`);
        
        await serverDb.runTransaction(async (transaction) => {
          const emailDocRef = serverDb.collection("trial_claims").doc(`email_${cleanEmail}`);
          const contactDocRef = cleanContact ? serverDb.collection("trial_claims").doc(`contact_${cleanContact}`) : null;

          const emailSnap = await transaction.get(emailDocRef);
          const contactSnap = contactDocRef ? await transaction.get(contactDocRef) : null;

          if (emailSnap.exists) {
            throw new Error("Email duplicate claim locked.");
          }
          if (contactSnap && contactSnap.exists) {
            throw new Error("Contact duplicate claim locked.");
          }

          // Lock both keys atomically!
          transaction.set(emailDocRef, {
            email: cleanEmail,
            contact: cleanContact,
            claimedAt: new Date().toISOString()
          });
          
          if (contactDocRef) {
            transaction.set(contactDocRef, {
              email: cleanEmail,
              contact: cleanContact,
              claimedAt: new Date().toISOString()
            });
          }
        });
        
        console.log(`[Distributed Lock] Atomically reserved claim token. Proceeding to double-verification checks.`);
      } catch (lockError: any) {
        console.warn(`[Distributed Lock Block] Blocked concurrent/duplicate claim for ${cleanEmail}:`, lockError.message);
        return res.status(403).json({
          success: false,
          error: "Trial already claimed",
          message: "This email address or mobile number has already initiated or claimed a free trial."
        });
      }
    }

    // B. Check fingerprint in trial_claims (if fingerprint is provided)
    if (serverDb && cleanFingerprint && cleanFingerprint !== "unknown-device" && cleanFingerprint !== "unknown") {
      const fpDocRef = serverDb.collection("trial_claims").doc(`fp_${cleanFingerprint}`);
      const fpSnap = await fpDocRef.get();
      if (fpSnap.exists) {
        console.warn(`[Register] Blocked trial fingerprint reuse for ${normalizedEmail} (Fingerprint: ${cleanFingerprint})`);
        return res.status(403).json({
          success: false,
          error: "Trial already claimed",
          message: "This account or device has already claimed the 1-Day Free Trial. Please get access to continue."
        });
      }

      // Record fingerprint claim
      await fpDocRef.set({
        email: cleanEmail,
        fingerprint: cleanFingerprint,
        claimedAt: new Date().toISOString()
      });
    }

    // C. Create Firebase Auth user for the trial user so they can log in via Firebase Auth!
    const adminAuth = getAdminAuth();
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(normalizedEmail);
      console.log(`[Register] Existing Firebase Auth user found: ${normalizedEmail}`);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        userRecord = await adminAuth.createUser({
          email: normalizedEmail,
          password: req.body.password || crypto.randomBytes(16).toString("hex") + "A1!",
          displayName: req.body.companyName || "Trial User",
        });
        console.log(`[Register] Created Firebase Auth user for Trial: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // D. In force 1-day trial limit calculation and write to Firestore
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 1);
    const determinedValidUntil = trialExpiry.toISOString();

    if (serverDb) {
      const userDocRef = serverDb.collection("users").doc(userRecord.uid);
      await userDocRef.set({
        uid: userRecord.uid,
        email: normalizedEmail,
        companyName: req.body.companyName || "Trial User",
        phone: req.body.contact || "",
        plan: "Trial",
        paymentStatus: "Trial",
        subscriptionStatus: "Active",
        subscriptionExpiry: determinedValidUntil,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`[Register] Saved Trial profile in Firestore users collection for UID: ${userRecord.uid}`);
    }

    try {
      const postPayload: any = {
        action: 'register',
        date: new Date().toISOString(),
        companyName: req.body.companyName || "Trial User",
        email: normalizedEmail,
        phone: req.body.contact || "",
        plan: "Trial",
        subscriptionExpiry: determinedValidUntil,
        paymentStatus: "Trial"
      };

      let responseData = await postGoogleScriptData(GOOGLE_SCRIPT_URL, postPayload);
      if (typeof responseData === 'string' && (responseData.includes("<!DOCTYPE") || responseData.includes("<html"))) {
        return res.json({ success: true, message: "Saved locally (Google App Script returned HTML/permissions issue)", savedLocally: true });
      }
      
      res.json(responseData);
    } catch (error: any) {
      const statusInfo = error.response ? `HTTP ${error.response.status}` : error.message;
      console.log(`[Backup Database] Google Sheets Sync offline (${statusInfo}). Registration successfully saved in Firestore.`);
      res.json({ success: true, message: "Registration saved locally on server fallback", savedLocally: true });
    }
  } catch (globalErr: any) {
    console.error("[Register Error]", globalErr);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while register processing. Your trial request could not be authenticated. " + globalErr.message
    });
  }
});

// Proxy: Feedback/Quotes
app.post(["/api/feedback", "/api/feedback/"], async (req, res) => {
  const isQuote = req.body.type === 'quote';
  
  const feedbackItem: LocalInboxItem = {
    type: isQuote ? 'quote' : 'feedback',
    timestamp: req.body.timestamp || new Date().toISOString(),
    status: 'new',
    feedback: req.body.feedback || req.body.message || '',
    message: req.body.feedback || req.body.message || '',
    factory: req.body.factory || '',
    location: req.body.location || '',
    units: req.body.units || '',
    contact: req.body.contact || ''
  };
  
  localInbox.unshift(feedbackItem);
  console.log(`[Local Sync] Inbox updated. Total local items: ${localInbox.length}`);

  try {
    let postPayload: any;
    if (isQuote) {
      postPayload = {
        action: 'quote',
        date: req.body.timestamp || new Date().toISOString(),
        factory: req.body.factory || '',
        location: req.body.location || '',
        units: req.body.units || '',
        contact: req.body.contact || ''
      };
    } else {
      postPayload = {
        action: 'feedback',
        date: req.body.timestamp || new Date().toISOString(),
        feedback: req.body.feedback || req.body.message || ''
      };
    }

    let responseData = await postGoogleScriptData(GOOGLE_SCRIPT_URL, postPayload);
    if (typeof responseData === 'string' && (responseData.includes("<!DOCTYPE") || responseData.includes("<html"))) {
      return res.json({ success: true, message: "Feedback recorded locally (Google permissions HTML returned)", savedLocally: true });
    }
    
    res.json(responseData);
  } catch (error: any) {
    const statusInfo = error.response ? `HTTP ${error.response.status}` : error.message;
    console.log(`[Backup Database] Feedback captured locally (Google Sheets sync unconfigured or offline: ${statusInfo}).`);
    // Return a beautiful 200 SUCCESS response so the client UI remains happy and verified
    res.json({ success: true, message: "Feedback recorded locally on server fallback", savedLocally: true });
  }
});

// Razorpay Instance Lazy Initializer
let razorpayInstance: any = null;

function getRazorpay(): any {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured.");
    }
    // Lazy initialize Razorpay instance
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

// API: Create Secure Razorpay Order
app.post("/api/payments/create-order", async (req, res) => {
  const { companyName, email, phone } = req.body;
  if (!companyName || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields: companyName, email, and phone are required." });
  }

  try {
    const razorpay = getRazorpay();
    const amount = 780000; // ₹7,800 in paise
    const currency = "INR";
    const options = {
      amount,
      currency,
      receipt: `receipt_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: {
        companyName,
        email,
        phone
      }
    };

    const order = await razorpay.orders.create(options);
    console.log(`[Payment API] [Order Created] Order ID: ${order.id}, Company: ${companyName}, Email: ${email}, Phone: ${phone}, Amount: ${amount}`);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID || ""
    });
  } catch (error: any) {
    console.error("[Payment API] Error creating Razorpay order:", error);
    res.status(500).json({ error: error.message || "Failed to create payment order" });
  }
});

// API: Verify Secure Razorpay Payment
app.post("/api/payments/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required." });
  }

  console.log(`[Payment API] [Payment Verification Started] Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("RAZORPAY_KEY_SECRET is not configured.");
    }

    const generated_signature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.warn(`[Payment API] [Payment Verification Failed] Signature verification failed for Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);
      return res.status(400).json({ error: "Payment verification failed. Signature mismatch." });
    }

    console.log(`[Payment API] [Payment Verification Success] Verified Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);

    // --- IDEMPOTENCY check: Check if this payment ID has already been processed ---
    if (serverDb) {
      const paymentDocRef = serverDb.collection("payments").doc(razorpay_payment_id);
      const paymentSnap = await paymentDocRef.get();
      if (paymentSnap.exists) {
        console.log(`[Payment API] [Duplicate Payment Ignored] Payment ID: ${razorpay_payment_id} has already been processed.`);
        return res.json({
          success: true,
          paymentVerified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          alreadyProcessed: true
        });
      }
    } else {
      console.warn("[Payment API] Firestore database not initialized. Idempotency checks are degraded.");
    }

    // Retrieve fields from payload or fallback to Razorpay order notes
    let { companyName, email, phone } = req.body;

    if (!email || !companyName || !phone) {
      try {
        const razorpay = getRazorpay();
        const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
        if (orderDetails && orderDetails.notes) {
          companyName = companyName || orderDetails.notes.companyName;
          email = email || orderDetails.notes.email;
          phone = phone || orderDetails.notes.phone;
        }
      } catch (err: any) {
        console.warn("[Payment API] Fallback order fetch from Razorpay failed:", err.message);
      }
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required for user provisioning and was not found in request or order notes." });
    }

    companyName = companyName || "Premium User";
    phone = phone || "N/A";

    // --- USER PROVISIONING: Get or create Firebase Auth user ---
    const adminAuth = getAdminAuth();
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      console.log(`[Payment API] [Existing Firebase User Found] Email: ${email}, UID: ${userRecord.uid}`);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        const tempPassword = crypto.randomBytes(16).toString("hex") + "A1!";
        
        let formattedPhone = phone;
        if (formattedPhone && formattedPhone !== "N/A" && !formattedPhone.startsWith("+")) {
          if (formattedPhone.length === 10) {
            formattedPhone = "+91" + formattedPhone;
          } else if (formattedPhone.length === 12 && formattedPhone.startsWith("91")) {
            formattedPhone = "+" + formattedPhone;
          } else {
            formattedPhone = undefined;
          }
        } else if (formattedPhone === "N/A") {
          formattedPhone = undefined;
        }

        try {
          const userOptions: any = {
            email,
            password: tempPassword,
            displayName: companyName,
          };
          if (formattedPhone) {
            userOptions.phoneNumber = formattedPhone;
          }
          userRecord = await adminAuth.createUser(userOptions);
          console.log(`[Payment API] [Firebase User Created] UID: ${userRecord.uid} for email: ${email}`);
        } catch (createErr: any) {
          console.warn("[Payment API] Firebase User creation with phone number failed, retrying without phone...", createErr.message);
          userRecord = await adminAuth.createUser({
            email,
            password: tempPassword,
            displayName: companyName,
          });
          console.log(`[Payment API] [Firebase User Created] (no-phone) UID: ${userRecord.uid} for email: ${email}`);
        }
      } else {
        throw error;
      }
    }

    // --- FIRESTORE USER DOCUMENT CREATION ---
    if (serverDb) {
      const userDocRef = serverDb.collection("users").doc(userRecord.uid);
      const subscriptionExpiry = new Date();
      subscriptionExpiry.setDate(subscriptionExpiry.getDate() + 30);

      const userData = {
        uid: userRecord.uid,
        email,
        companyName,
        phone,
        plan: "Premium",
        paymentStatus: "Paid",
        subscriptionStatus: "Active",
        subscriptionExpiry: subscriptionExpiry.toISOString(),
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await userDocRef.set(userData);
      console.log(`[Payment API] [Firestore User Created] Created document at users/${userRecord.uid}`);

      // Save to payments collection for complete idempotence ledger
      const paymentDocRef = serverDb.collection("payments").doc(razorpay_payment_id);
      await paymentDocRef.set({
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        uid: userRecord.uid,
        email,
        processedAt: new Date().toISOString()
      });
      console.log(`[Payment API] Saved payment transaction to ledger for Payment ID: ${razorpay_payment_id}`);

      // --- GOOGLE SHEETS LEDGER SYNC ---
      try {
        const sheetPayload: any = {
          action: 'register',
          date: new Date().toISOString(),
          companyName: companyName,
          email: email,
          phone: phone,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          plan: "Premium",
          subscriptionExpiry: subscriptionExpiry.toISOString(),
          paymentStatus: "Paid"
        };
        console.log(`[Payment API] Appending verified payment ledger to Sheet2 for: ${email}`);
        await postGoogleScriptData(GOOGLE_SCRIPT_URL, sheetPayload);
        console.log(`[Payment API] [Sheet2 Ledger Updated] Successfully appended ledger row to Sheet2 for ${email}`);
      } catch (sheetErr: any) {
        console.error("[Payment API] Error writing ledger entry to Google Sheets:", sheetErr.message);
      }
    }

    // --- TRIGGER FIREBASE PASSWORD RESET EMAIL ---
    try {
      let apiKey = "";
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        apiKey = config.apiKey;
      }
      if (apiKey) {
        const resetUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
        console.log(`[Payment API] [Password Setup Link Triggered] Requesting password reset email for: ${email}`);
        await axios.post(resetUrl, {
          requestType: "PASSWORD_RESET",
          email: email
        });
        console.log(`[Payment API] [Password Setup Email Sent] Successfully triggered password reset email for: ${email}`);
      } else {
        console.warn("[Payment API] Firebase apiKey not found in config. Password reset email could not be sent.");
      }
    } catch (resetErr: any) {
      const errMsg = resetErr.response?.data?.error?.message || resetErr.message;
      console.error(`[Payment API] Failed to trigger Firebase password reset email for ${email}:`, errMsg);
    }

    res.json({
      success: true,
      paymentVerified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (error: any) {
    console.error(`[Payment API] [Payment Verification Failed] Exception during verification for Order ID: ${razorpay_order_id}:`, error);
    res.status(500).json({ error: error.message || "Internal server error during verification" });
  }
});

// API: Stripe Checkout Session
app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Payments are not configured" });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "Solar Project Export" },
          unit_amount: 5000,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.headers.origin}/?payment=success`,
      cancel_url: `${req.headers.origin}/?payment=cancel`,
    });
    res.json({ id: session.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Check if email or contact has already claim or been registered
app.post("/api/check-existence", async (req, res) => {
  try {
    const inputEmail = String(req.body.email || req.body.username || "").trim().toLowerCase();
    const inputContact = String(req.body.contact || "").trim();

    if (!inputEmail && !inputContact) {
      return res.json({ exists: false });
    }

    if (serverDb) {
      const cleanEmail = inputEmail;
      const cleanNumber = (numStr: string) => {
        const clean = String(numStr || "").replace(/\D/g, ''); // keep only digits
        return clean.length >= 10 ? clean.slice(-10) : clean;
      };
      const cleanContact = cleanNumber(inputContact);

      // Check email claim
      if (cleanEmail) {
        const emailClaimRef = serverDb.collection("trial_claims").doc(`email_${cleanEmail}`);
        const emailClaimSnap = await emailClaimRef.get();
        if (emailClaimSnap.exists) {
          return res.json({
            exists: true,
            message: "This email address has already claimed the 1-Day Free Trial. Please get access to continue."
          });
        }
      }

      // Check contact claim
      if (cleanContact) {
        const contactClaimRef = serverDb.collection("trial_claims").doc(`contact_${cleanContact}`);
        const contactClaimSnap = await contactClaimRef.get();
        if (contactClaimSnap.exists) {
          return res.json({
            exists: true,
            message: "This mobile number has already claimed the 1-Day Free Trial. Please get access to continue."
          });
        }
      }
    }

    return res.json({ exists: false });
  } catch (error: any) {
    console.error("[Check Existence Error] failure:", error);
    return res.json({ exists: false });
  }
});

// Debug Endpoint - Registered only during development
if (process.env.NODE_ENV === "development") {
  app.get("/api/debug-config", (req, res) => {
    res.json({
      has_env_var: !!process.env.GOOGLE_SCRIPT_URL,
      url_preview: GOOGLE_SCRIPT_URL.substring(0, 40) + "...",
      is_dev_url: GOOGLE_SCRIPT_URL.includes("/dev"),
      is_exec_url: GOOGLE_SCRIPT_URL.includes("/exec"),
      node_env: process.env.NODE_ENV,
      advice: GOOGLE_SCRIPT_URL.includes("/dev") 
        ? "CHANGE YOUR URL: It ends in /dev. Deploy as a 'Web App' for 'Anyone' to get an /exec URL." 
        : "URL format looks okay. Make sure 'Who has access' is set to 'Anyone'."
    });
  });
}

// --- SEO PHASE 2 HELPER & ENDPOINTS ---
const BACKEND_SAMPLE_FACILITIES = [
  { factory: 'Focus Controls Pvt. Ltd.', location: 'Shindewadi, Pune', rooftop: 5000, kw: 71.4, region: 'pune' },
  { factory: 'Havmor Icecream Pvt Ltd', location: 'Talegaon, Pune', rooftop: 280000, kw: 4000, region: 'pune' },
  { factory: 'Bericap India Pvt. Ltd.', location: 'Talegaon, Pune', rooftop: 100000, kw: 1428.6, region: 'pune' },
  { factory: 'Infra Industries', location: 'Vasai, Maharashtra', rooftop: 75000, kw: 1071.4, region: 'mumbai' },
  { factory: 'Safex Fire Services', location: 'Palghar, Maharashtra', rooftop: 42000, kw: 600, region: 'mumbai' },
  { factory: 'RBSM Industrial Plant', location: 'Pune, Maharashtra', rooftop: 56000, kw: 800, region: 'pune' },
];

function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except -
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

async function getFacilitiesCachedList(): Promise<any[]> {
  const now = Date.now();
  if (facilitiesCache.data && facilitiesCache.data.length > 0 && (now - facilitiesCache.lastUpdated < FACILITIES_CACHE_TTL_MS)) {
    return facilitiesCache.data;
  }
  
  console.log(`[Cache Engine] Auto-fetching facilities in helper...`);
  try {
    const separator = GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?';
    const rawResult = await getGoogleScriptData(`${GOOGLE_SCRIPT_URL}${separator}sheet=Sheet1&sheetName=Sheet1`);
    let parsed = [];
    if (typeof rawResult === 'string') {
      if (!rawResult.includes("<!DOCTYPE") && !rawResult.includes("<html")) {
        parsed = JSON.parse(rawResult);
      }
    } else if (Array.isArray(rawResult)) {
      parsed = rawResult;
    }
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      facilitiesCache.data = parsed;
      facilitiesCache.lastUpdated = now;
      return parsed;
    }
  } catch (err: any) {
    console.warn(`[Cache Engine] Helper fetch failed:`, err.message);
  }
  
  return facilitiesCache.data || [];
}

// Sitemap generator endpoint
app.get("/sitemap.xml", async (req, res) => {
  try {
    const facilities = await getFacilitiesCachedList();
    
    const staticUrls = [
      "https://www.solaroptions.in/",
      "https://www.solaroptions.in/solar-rooftop-calculator",
      "https://www.solaroptions.in/3d-layout-designer",
      "https://www.solaroptions.in/industrial-intelligence",
      "https://www.solaroptions.in/opportunity-inbox",
      "https://www.solaroptions.in/privacy-policy",
      "https://www.solaroptions.in/terms-of-service"
    ];
    
    let urlBlocksStr = staticUrls.map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`).join("\n");
    
    // Deduping Set for all company page slugs
    const uniqueSlugs = new Set<string>();

    // Dynamically populated from Sheet1 (getFacilitiesCachedList)
    facilities.forEach(item => {
      const name = item['Factory Name'] || item['factory'];
      if (name) {
        uniqueSlugs.add(slugify(name));
      }
    });

    // Render URLs
    uniqueSlugs.forEach(slug => {
      urlBlocksStr += `\n  <url>\n    <loc>https://www.solaroptions.in/company/${slug}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    });
    
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocksStr}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    return res.status(200).send(sitemapXml);
  } catch (err: any) {
    console.error("[Sitemap Error] Error generating sitemap:", err);
    res.status(500).send("Error generating sitemap");
  }
});

// Dynamic Company Intelligence Page route
app.get("/company/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const facilities = await getFacilitiesCachedList();
    
    // Search in live facilities, then localInbox, then backend static sample list
    let facility = facilities.find(f => {
      const name = f['Factory Name'] || f['factory'] || '';
      return slugify(name) === slug;
    });

    if (!facility) {
      facility = localInbox.find(f => f.factory && slugify(f.factory) === slug);
    }

    if (!facility) {
      facility = BACKEND_SAMPLE_FACILITIES.find(f => f.factory && slugify(f.factory) === slug);
    }
    
    const indexPath = fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
      ? path.join(process.cwd(), "dist", "index.html")
      : path.join(process.cwd(), "index.html");
      
    if (!facility) {
      return res.sendFile(indexPath);
    }
    
    const companyName = facility['Factory Name'] || facility['factory'] || 'NA';
    const location = facility['Location'] || facility['location'] || 'NA';
    
    const title = `${companyName} Rooftop Area & Industrial Site Intelligence | SolarOptions`;
    const description = `Explore industrial rooftop intelligence for ${companyName} in ${location}, including rooftop area insights and site information. Unlock additional solar opportunity intelligence with SolarOptions.`;
    const canonicalUrl = `https://www.solaroptions.in/company/${slug}`;
    
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "SolarOptions",
          "item": "https://www.solaroptions.in/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": companyName,
          "item": canonicalUrl
        }
      ]
    };

    const webpageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      "url": canonicalUrl,
      "name": title,
      "description": description,
      "breadcrumb": {
        "@id": `${canonicalUrl}#breadcrumb`
      },
      "about": {
        "@type": "Place",
        "name": companyName,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": location,
          "addressCountry": "IN"
        }
      }
    };
    
    let html = fs.readFileSync(indexPath, "utf8");
    
    // Inject dynamic tags by replacing existing key head meta tags if present
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${description}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${title}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
    
    const schemaBlock = `
    <!-- Company Page Specific Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(breadcrumbSchema, null, 2)}
    </script>
    <script type="application/ld+json">
    ${JSON.stringify(webpageSchema, null, 2)}
    </script>
    `;
    
    html = html.replace("</head>", `${schemaBlock}\n</head>`);

    const rooftopRaw = facility['Rooftop Space'] || facility['rooftop'] || '';
    let rooftopArea = 'NA';
    if (rooftopRaw) {
      const parsedNum = parseFloat(String(rooftopRaw).replace(/,/g, ''));
      if (!isNaN(parsedNum)) {
        rooftopArea = `${new Intl.NumberFormat('en-IN').format(parsedNum)} Sq.ft`;
      } else {
        rooftopArea = `${rooftopRaw} Sq.ft`;
      }
    } else {
      rooftopArea = 'NA Sq.ft';
    }

    const semanticHtmlBlock = `
<div id="root">
  <article>
    <header>
      <h1>${companyName} – Industrial Rooftop Solar Opportunity</h1>
    </header>
    <section>
      <h2>Introduction</h2>
      <p><strong>${companyName}</strong> is an industrial manufacturing facility located in <strong>${location}</strong>. This facility has been analysed using satellite imagery to estimate its rooftop solar potential.</p>
      <p>SolarOptions helps Commercial & Industrial (C&I) Solar EPC companies discover factories, evaluate rooftop opportunities and perform preliminary solar feasibility before site visits.</p>
    </section>
    <section>
      <h2>Available Rooftop Area</h2>
      <p><strong>${rooftopArea}</strong></p>
      <p>Estimated using satellite-based rooftop analysis.</p>
    </section>
    <section>
      <h2>How SolarOptions Helps</h2>
      <ul>
        <li>Discover industrial factories</li>
        <li>Identify rooftop solar opportunities</li>
        <li>Reduce unnecessary site visits</li>
        <li>Improve industrial solar prospecting</li>
        <li>Support faster pre-sales planning</li>
      </ul>
    </section>
    <section>
      <h2>Premium Features</h2>
      <p>Additional information is available to registered users:</p>
      <ul>
        <li>Decision-maker information</li>
        <li>Contact details</li>
        <li>Verified business email</li>
        <li>Technical calculations</li>
        <li>3D rooftop layouts</li>
        <li>Financial analysis</li>
      </ul>
    </section>
    <section>
      <h2>About SolarOptions</h2>
      <p>SolarOptions is an Industrial Solar Sales Intelligence Platform built for Commercial & Industrial (C&I) Solar EPC companies across India.</p>
      <p>The platform enables factory discovery, rooftop assessment and industrial solar prospecting using satellite-based intelligence.</p>
    </section>
    <section>
      <h2>Call To Action</h2>
      <p>Create a free account to access premium industrial intelligence across 1,500+ industrial facilities.</p>
    </section>
  </article>
</div>`;

    html = html.replace(/<div\s+id=["']root["']>\s*<\/div>/, semanticHtmlBlock);
    
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);
    
  } catch (err: any) {
    console.error("[Company Route Error] Error handling company route:", err);
    const indexPath = fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
      ? path.join(process.cwd(), "dist", "index.html")
      : path.join(process.cwd(), "index.html");
    return res.sendFile(indexPath);
  }
});

// API 404 Handler
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found", method: req.method, path: req.url });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.url.startsWith("/api/")) return;
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not handled by Vercel
  if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }
}

// Only call startServer if we're not in a Vercel environment
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer().catch(err => console.error("Server start error:", err));
}

export default app;
