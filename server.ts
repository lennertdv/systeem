import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin lazily
let adminApp: admin.app.App | null = null;
function getAdmin(): admin.app.App {
  if (!adminApp) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
    }
    try {
      const cert = JSON.parse(serviceAccount);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(cert)
      });
    } catch (e) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
    }
  }
  return adminApp;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    try {
      const { name, slug, email, password } = req.body;
      const admin = getAdmin();
      const auth = admin.auth();
      const db = admin.firestore();

      // 1. Create Auth User
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });

      // 2. Create Restaurant Info
      await db.collection('restaurants').doc(slug).collection('info').doc('general').set({
        name,
        slug,
        ownerEmail: email,
        ownerUid: userRecord.uid,
        active: true,
        createdAt: Date.now(),
        plan: 'starter'
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
}

startServer();
