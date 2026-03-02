import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";

console.log("[SERVER] Starting server.ts initialization...");

dotenv.config();

// Initialize Firebase Admin lazily
let adminApp: admin.app.App | null = null;
function getAdmin(): admin.app.App {
  if (!adminApp) {
    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
      console.error('SUPER_ADMIN_ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is missing');
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
    }

    try {
      if (serviceAccount.startsWith('AIza')) {
        throw new Error('It looks like you provided a Firebase API Key (starting with AIza) instead of a Service Account JSON. Please provide the full JSON from Firebase Console -> Project Settings -> Service Accounts.');
      }

      console.log(`[SUPER_ADMIN_DEBUG] Service account string length: ${serviceAccount.length}`);
      console.log(`[SUPER_ADMIN_DEBUG] Starts with: ${serviceAccount.substring(0, 20)}...`);

      // 1. Handle potential base64 encoding
      if (!serviceAccount.trim().startsWith('{')) {
        try {
          const decoded = Buffer.from(serviceAccount, 'base64').toString('utf8');
          if (decoded.trim().startsWith('{')) {
            serviceAccount = decoded;
            console.log('[SUPER_ADMIN_DEBUG] Successfully decoded base64 service account');
          }
        } catch (e) {
          // Not base64 or failed to decode, continue
        }
      }

      // 2. Parse JSON
      let cert;
      try {
        cert = JSON.parse(serviceAccount);
      } catch (e) {
        // Try cleaning the string (remove potential wrapping quotes or escaped characters)
        const cleaned = serviceAccount.trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
        cert = JSON.parse(cleaned);
        console.log('[SUPER_ADMIN_DEBUG] Parsed JSON after cleaning string');
      }
      
      // 3. Fix Private Key Formatting
      if (cert.private_key && typeof cert.private_key === 'string') {
        // Replace literal \n with actual newlines, and handle double-escaped backslashes
        cert.private_key = cert.private_key
          .replace(/\\n/g, '\n')
          .replace(/\n\n/g, '\n'); // Remove accidental double newlines
        
        // Ensure it has the correct headers if they were stripped
        if (!cert.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
          cert.private_key = `-----BEGIN PRIVATE KEY-----\n${cert.private_key}\n-----END PRIVATE KEY-----\n`;
        }
      }

      adminApp = admin.initializeApp({
        credential: admin.credential.cert(cert)
      });
      console.log('SUPER_ADMIN: Firebase Admin initialized successfully');
    } catch (e: any) {
      console.error('SUPER_ADMIN_ERROR: Failed to initialize Firebase Admin:', e.message);
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT: ${e.message}`);
    }
  }
  return adminApp;
}

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    // Global request logger
    app.use((req, res, next) => {
      console.log(`[SERVER] ${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });

    app.use(cors());
    app.use(express.json());

  // Initialize Stripe only when needed to prevent crashing on startup if key is missing
  let stripeClient: Stripe | null = null;
  function getStripe(): Stripe {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required');
      }
      stripeClient = new Stripe(key, {
        apiVersion: '2023-10-16' as any, // Use a stable API version
      });
    }
    return stripeClient;
  }

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/super-admin/health", (req, res) => {
    res.json({ status: "super-admin-ok" });
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = 'usd' } = req.body;
      
      if (amount === undefined || amount === null || isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid or missing amount' });
      }

      const amountInCents = Math.round(amount * 100);
      if (amountInCents < 50) {
        return res.status(400).json({ error: 'Amount must be at least $0.50' });
      }

      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent.client_secret) {
        throw new Error('Stripe failed to generate a client secret');
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post("/api/super-admin/create-restaurant", async (req, res) => {
    console.log(`[SERVER] POST /api/super-admin/create-restaurant - Body:`, JSON.stringify(req.body));
    try {
      const { name, slug, email, password } = req.body;
      
      if (!name || !slug || !email || !password) {
        console.warn('[SUPER_ADMIN] Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const adminInstance = getAdmin();
      const auth = adminInstance.auth();
      const db = adminInstance.firestore();

      console.log(`SUPER_ADMIN: Creating restaurant ${name} (${slug}) for ${email}`);

      // 1. Create Auth User
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });

      // 2. Create Restaurant Settings
      await db.collection('restaurants').doc(slug).set({
        createdAt: Date.now(),
        slug
      });

      await db.collection('restaurants').doc(slug).collection('settings').doc('general').set({
        restaurantName: name,
        slug,
        ownerEmail: email,
        ownerUid: userRecord.uid,
        isOpen: true,
        createdAt: Date.now(),
        plan: 'starter',
        currency: '€'
      });

      // 3. Create User Record
      await db.collection('users').doc(userRecord.uid).set({
        role: 'tenant',
        restaurantSlug: slug,
        email
      });

      // 4. Seed empty menu
      await db.collection('restaurants').doc(slug).collection('categories').add({
        name: 'Main Menu',
        order: 1
      });

      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      console.error("Super Admin error:", error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 404 handler for API routes (must be before Vite/SPA fallback)
  app.use("/api/*", (req, res) => {
    console.warn(`[SERVER] 404 on API route: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  } catch (error) {
    console.error("FATAL SERVER ERROR:", error);
  }
}

startServer().catch(err => {
  console.error("CRITICAL: FAILED TO START SERVER:", err);
  process.exit(1);
});
