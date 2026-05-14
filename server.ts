import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbycpu9irUypX9jXEGKgx-tbKW41dbQE_zTJHuhlf1TiT2a_ImksFFrVH3fCDtp523o8EQ/exec";
console.log(`[Server] Using Google Script URL from ${process.env.GOOGLE_SCRIPT_URL ? 'environment variable' : 'default value'}: ${GOOGLE_SCRIPT_URL.substring(0, 30)}...`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the AI Studio / Nginx proxy
  app.set("trust proxy", true);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    if (req.url.startsWith("/api") || !req.url.includes(".")) {
      console.log(`[Server] ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check
  app.get(["/api/health", "/api/status"], (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy: Get Leads
  app.get(["/api/leads", "/api/leads/"], async (req, res) => {
    // Allow if it has our signature or is from our origin
    const isInternal = req.headers["x-requested-with"] === "SolarOptionsApp";
    if (!isInternal && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        headers: {
          "User-Agent": "SolarOptions/1.0"
        }
      });
      
      if (response.status === 404) {
        return res.status(404).json({ error: "Upstream service not found" });
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error("[Proxy] Leads response was not JSON:", text.substring(0, 100));
        res.status(502).json({ error: "Upstream service returned invalid data" });
      }
    } catch (error: any) {
      console.error("[Proxy] Leads error:", error.message);
      res.status(500).json({ error: "Failed to connect to upstream service" });
    }
  });

  // Proxy: Login
  app.post(["/api/login", "/api/login/"], async (req, res) => {
    console.log(`[Login] Received POST request to /api/login`);
    
    // Basic body validation
    if (!req.body || !req.body.username || !req.body.password) {
      console.warn(`[Login] Missing credentials in request body`);
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      console.log(`[Proxy] Attempting login proxy to: ${GOOGLE_SCRIPT_URL}`);
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "SolarOptions/1.0"
        },
        body: JSON.stringify({
          action: 'login',
          username: req.body.username,
          password: req.body.password
        }),
      });
      
      const status = response.status;
      console.log(`[Proxy] Upstream response status: ${status}`);
      
      const text = await response.text();
      
      if (status >= 400) {
        console.error(`[Proxy] Upstream login service error ${status}:`, text.substring(0, 200));
        return res.status(status).json({ 
          error: `Authentication Service Error (${status})`,
          message: status === 404 ? "Internal configuration error: Upstream script not found." : "Service unavailable"
        });
      }

      try {
        const data = JSON.parse(text);
        console.log(`[Proxy] Login successful for: ${req.body.username}`);
        res.json(data);
      } catch (e) {
        console.error("[Proxy] Login response was not valid JSON:", text.substring(0, 100));
        res.status(502).json({ 
          error: "Authentication service returned an invalid response format",
          debug: text.substring(0, 50)
        });
      }
    } catch (error: any) {
      console.error("[Proxy] Login connection failed:", error.message);
      res.status(500).json({ error: "Could not connect to authentication service" });
    }
  });

  // Proxy: Register/Payment Sync
  app.post(["/api/register", "/api/register/"], async (req, res) => {
    console.log(`[Register] Received POST request to /api/register`);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "SolarOptions/1.0"
        },
        body: JSON.stringify({
          action: 'register',
          ...req.body
        }),
      });
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch {
        res.json({ success: true, message: "Action recorded" });
      }
    } catch (error: any) {
      console.error("[Proxy] Register error:", error.message);
      res.status(500).json({ error: "Registration service unavailable" });
    }
  });

  // API: Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Payments are not configured on the server" });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Solar Project Design Export",
                description: "Full technical specifications and 3D design export",
              },
              unit_amount: 5000,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/?payment=success`,
        cancel_url: `${req.headers.origin}/?payment=cancel`,
      });

      res.json({ id: session.id });
    } catch (error: any) {
      console.error("[Stripe] Session creation error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API 404 Handler - Catch all other /api/* requests
  app.all("/api/*", (req, res) => {
    console.warn(`[Server] Unhandled API route: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API endpoint not found",
      method: req.method,
      path: req.url 
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
