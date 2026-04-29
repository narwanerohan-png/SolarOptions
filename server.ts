import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for leads and feedback (resets on server restart)
  // In a real app, we would use a database like Firestore
  let inbox: any[] = [];

  // API Route for Feedback and Quote Requests
  app.post("/api/feedback", async (req, res) => {
    const { type, message, factory, location, units, contact } = req.body;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      message,
      factory,
      location,
      units,
      contact,
      status: 'new'
    };

    inbox.unshift(newEntry); // Add to start of list
    
    console.log("-----------------------------------------");
    console.log(`NEW ${type === 'quote' ? 'QUOTE REQUEST' : 'FEEDBACK'} RECEIVED`);
    console.log(JSON.stringify(newEntry, null, 2));
    console.log("-----------------------------------------");

    setTimeout(() => {
      res.json({ success: true, message: "Request delivered to system." });
    }, 500);
  });

  // API Route for Admin to see the inbox
  app.get("/api/admin/inbox", (req, res) => {
    res.json(inbox);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
