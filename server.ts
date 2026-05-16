import express from "express";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const GOOGLE_SCRIPT_URL = (process.env.GOOGLE_SCRIPT_URL && process.env.GOOGLE_SCRIPT_URL.length > 10) 
  ? process.env.GOOGLE_SCRIPT_URL 
  : "https://script.google.com/macros/s/AKfycbyCo6CZ51CO8-fb8UupLEbU7GZ82Pb31dg8v8hMRK_bvd0FqoOVPnd2QSejiXfBZvGtWg/exec";

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

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
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      headers: FETCH_HEADERS,
      redirect: 'follow'
    } as any);
    
    if (response.status === 404) {
      return res.status(404).json({ 
        error: "Upstream Script Not Found (404)",
        suggestion: "The Google Apps Script ID might be wrong, or it is not deployed as a 'Web App'.",
        debug_link: GOOGLE_SCRIPT_URL
      });
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (e) {
      res.status(502).json({ error: "Upstream service returned invalid data" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to connect to upstream service" });
  }
});

// Proxy: Login
app.post(["/api/login", "/api/login/"], async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { 
        ...FETCH_HEADERS,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: 'login',
        username: req.body.username,
        password: req.body.password
      }),
      redirect: 'follow'
    } as any);
    
    const status = response.status;
    const text = await response.text();
    
    if (status >= 400) {
      return res.status(status).json({ 
        error: status === 404 ? "Backend Script Not Found (404)" : `Authentication Service Error (${status})`,
        upstream_status: status
      });
    }

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (e) {
      res.status(502).json({ error: "Authentication service returned an invalid response" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Could not connect to authentication service" });
  }
});

// Proxy: Register/Payment Sync
app.post(["/api/register", "/api/register/"], async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { 
        ...FETCH_HEADERS,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: 'register',
        ...req.body
      }),
      redirect: 'follow'
    } as any);
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      res.json(json);
    } catch {
      res.json({ success: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Registration service unavailable" });
  }
});

// Proxy: Feedback/Quotes
app.post(["/api/feedback", "/api/feedback/"], async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { 
        ...FETCH_HEADERS,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: req.body.type === 'quote' ? 'quote' : 'feedback',
        ...req.body
      }),
      redirect: 'follow'
    } as any);
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      res.json(json);
    } catch {
      res.json({ success: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Feedback service unavailable" });
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

startServer().catch(err => console.error("Server start error:", err));

export default app;

