import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

function getAdmin(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!;
  if (adminApp) return adminApp;

  let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT is required');

  if (!serviceAccount.trim().startsWith('{')) {
    try {
      const decoded = Buffer.from(serviceAccount, 'base64').toString('utf8');
      if (decoded.trim().startsWith('{')) serviceAccount = decoded;
    } catch (e) {}
  }

  let cert;
  try {
    cert = JSON.parse(serviceAccount);
  } catch (e) {
    cert = JSON.parse(serviceAccount.trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"'));
  }

  if (cert.private_key) {
    cert.private_key = cert.private_key.replace(/\\n/g, '\n').replace(/\n\n/g, '\n');
    if (!cert.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
      cert.private_key = `-----BEGIN PRIVATE KEY-----\n${cert.private_key}\n-----END PRIVATE KEY-----\n`;
    }
  }

  adminApp = admin.initializeApp({ credential: admin.credential.cert(cert) });
  return adminApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const adminInstance = getAdmin();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminInstance.auth().verifyIdToken(idToken);

    const callerDoc = await adminInstance.firestore()
      .collection('users').doc(decodedToken.uid).get();

    if (!callerDoc.exists || callerDoc.data()?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { ownerUid, slug } = req.body;
    if (!ownerUid) return res.status(400).json({ error: 'ownerUid is required' });

    const customToken = await adminInstance.auth().createCustomToken(ownerUid);

    await adminInstance.firestore().collection('audit_log').add({
      action: 'impersonate',
      superAdminUid: decodedToken.uid,
      superAdminEmail: decodedToken.email || '',
      targetOwnerUid: ownerUid,
      restaurantSlug: slug || '',
      timestamp: Date.now(),
    });

    return res.status(200).json({ customToken });
  } catch (error: any) {
    console.error('Impersonate error:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
