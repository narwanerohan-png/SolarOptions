import express from "express";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";

if (!process.env.VERCEL) {
  dotenv.config();
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const GOOGLE_SCRIPT_URL = (process.env.GOOGLE_SCRIPT_URL && process.env.GOOGLE_SCRIPT_URL.trim().length > 10) 
  ? process.env.GOOGLE_SCRIPT_URL.trim() 
  : "https://script.google.com/macros/s/AKfycbwyJZNzqLT3m_fBgCiyzb_42pw7rf8RtqSQ3WX39Sxu/exec";

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
const PORT = 3000;

// Trust the AI Studio / Nginx proxy
app.set("trust proxy", true);

// Middleware
app.use(cors());
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

// Proxy: Get Leads
app.get(["/api/leads", "/api/leads/"], async (req, res) => {
  try {
    const response = await axios.get(GOOGLE_SCRIPT_URL, AXIOS_CONFIG);
    res.json(response.data);
  } catch (error: any) {
    console.error("[Leads Error]", error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: "Failed to connect to backend", 
      details: error.message,
      upstream_status: status
    });
  }
});

// Proxy: Login
app.post(["/api/login", "/api/login/"], async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL, {
      action: 'login',
      username: req.body.username,
      password: req.body.password
    }, AXIOS_CONFIG);
    
    // Google Scripts often return a 200 even for errors in the payload
    if (response.data && typeof response.data === 'string' && response.data.includes("Google Drive - Page Not Found")) {
       return res.status(404).json({ 
         success: false, 
         message: "Google Script not found or not published as 'Anyone'. Check your URL and deployment settings.",
         details: "The URL returned a Google 404 page instead of JSON." 
       });
    }

    res.json(response.data);
  } catch (error: any) {
    console.error("[Login Error Details]", {
      message: error.message,
      url: GOOGLE_SCRIPT_URL.substring(0, 40) + "...",
      isDevUrl: GOOGLE_SCRIPT_URL.includes("/dev"),
      status: error.response?.status
    });

    const status = error.response?.status || 500;
    const isDevUrlError = GOOGLE_SCRIPT_URL.includes("/dev");

    res.status(status).json({ 
      error: "Authentication service connection failed", 
      message: isDevUrlError 
        ? "Your URL ends in /dev. Go to 'Deploy > New Deployment' in Google Sheets and use the /exec URL instead." 
        : error.message,
      upstream_status: status,
      url_type: isDevUrlError ? "dev (invalid for web)" : "standard"
    });
  }
});

// Proxy: Register/Payment Sync
app.post(["/api/register", "/api/register/"], async (req, res) => {
  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL, {
      action: 'register',
      ...req.body
    }, AXIOS_CONFIG);
    res.json(response.data);
  } catch (error: any) {
    console.error("[Register Error]", error.message);
    res.status(500).json({ error: "Registration service unavailable", details: error.message });
  }
});

// Proxy: Feedback/Quotes
app.post(["/api/feedback", "/api/feedback/"], async (req, res) => {
  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL, {
      action: req.body.type === 'quote' ? 'quote' : 'feedback',
      ...req.body
    }, AXIOS_CONFIG);
    res.json(response.data);
  } catch (error: any) {
    console.error("[Feedback Error]", error.message);
    res.status(500).json({ error: "Feedback service unavailable", details: error.message });
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

// Debug Endpoint
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

