import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbycpu9irUypX9jXEGKgx-tbKW41dbQE_zTJHuhlf1TiT2a_ImksFFrVH3fCDtp523o8EQ/exec";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  // Debug route
  app.get("/api/status", (req, res) => {
    res.json({ status: "running", timestamp: new Date().toISOString() });
  });

  // Proxy: Get Leads (Server-side fetch to hide Script URL)
  app.get("/api/leads", async (req, res) => {
    // Simple integrity check to prevent direct browser URL access
    if (req.headers["x-requested-with"] !== "SolarOptionsApp") {
      return res.status(401).json({ error: "Direct access not allowed" });
    }

    try {
      console.log(`[Proxy] Fetching leads from: ${GOOGLE_SCRIPT_URL}`);
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error("[Proxy] Leads response was not JSON:", text.substring(0, 200));
        res.status(502).json({ error: "Invalid response format from upstream service" });
      }
    } catch (error: any) {
      console.error("[Proxy] Leads error:", error.message);
      res.status(500).json({ error: "Failed to fetch leads from upstream" });
    }
  });

  // Proxy: Login
  app.post("/api/login", async (req, res) => {
    if (req.headers["x-requested-with"] !== "SolarOptionsApp") {
      return res.status(401).json({ error: "Direct access not allowed" });
    }

    try {
      console.log(`[Proxy] Login attempt for: ${req.body.username}`);
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "text/plain;charset=utf-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        body: JSON.stringify(req.body),
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error("[Proxy] Login response was not JSON:", text.substring(0, 200));
        res.status(502).json({ error: "Authentication service returned an unexpected response format" });
      }
    } catch (error: any) {
      console.error("[Proxy] Login error:", error.message);
      res.status(500).json({ error: "Authentication service unavailable" });
    }
  });

  // Proxy: Register/Payment Sync
  app.post("/api/register", async (req, res) => {
    try {
      console.log(`[Proxy] Registration sync for: ${req.body.email}`);
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "text/plain;charset=utf-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        body: JSON.stringify(req.body),
      });
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch {
        res.json({ success: true, message: "Registered" });
      }
    } catch (error: any) {
      console.error("[Proxy] Register error:", error.message);
      res.status(500).json({ error: "Registration service unavailable" });
    }
  });

  // Explicitly handle any other /api routes with a 404
  app.all("/api/*", (req, res) => {
    console.log(`[Server] 404 API Route: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // API: Stripe Checkout Session for worldwide payments
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
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
              unit_amount: 5000, // $50.00
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
      res.status(500).json({ error: error.message });
    }
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
