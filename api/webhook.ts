import { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyCi1McJ5npdsoww9qiOVcyj_0gGFsjvqM4",
  authDomain: "vianovadb.firebaseapp.com",
  projectId: "vianovadb",
  storageBucket: "vianovadb.firebasestorage.app",
  messagingSenderId: "718350529823",
  appId: "1:718350529823:web:fda1e840eae4755c312c2a"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify webhook secret (you should set this in Vercel environment variables)
    const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET
    const signature = req.headers['x-vercel-signature']

    if (webhookSecret && signature !== webhookSecret) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { type, payload } = req.body

    // Handle different webhook events
    switch (type) {
      case 'deployment.succeeded':
        console.log('Deployment succeeded:', payload)
        // You could send notifications, update logs, etc.
        break

      case 'deployment.failed':
        console.log('Deployment failed:', payload)
        // Handle deployment failures
        break

      case 'deployment.created':
        console.log('Deployment created:', payload)
        // Handle deployment creation
        break

      default:
        console.log('Unknown webhook event:', type, payload)
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' })

  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}