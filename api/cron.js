import admin from 'firebase-admin';

// Securely initialize Firebase Admin using Vercel Environment Variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replaces literal '\n' with actual line breaks for the private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

const db = admin.firestore();
const messaging = admin.messaging();

export default async function handler(req, res) {
  try {
    const usersSnapshot = await db.collection('users').get();
    let sentCount = 0;

    // Scan every user in the vault
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;

      // If they haven't enabled push notifications, skip them
      if (!fcmToken) continue;

      // Grab their unpaid bills
      const billsSnapshot = await db.collection(`users/${userDoc.id}/bills`)
        .where('isPaid', '==', false)
        .get();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check each bill's due date
      for (const billDoc of billsSnapshot.docs) {
        const bill = billDoc.data();
        if (!bill.rawDate) continue;

        const bDate = new Date(bill.rawDate);
        const localBDate = new Date(bDate.getUTCFullYear(), bDate.getUTCMonth(), bDate.getUTCDate());

        // If the bill is due today or past due, fire the missile
        if (localBDate <= today) {
          const isOverdue = localBDate < today;
          
          await messaging.send({
            token: fcmToken,
            notification: {
              title: isOverdue ? '⚠️ Overdue Bill Alert' : '🔔 Bill Due Today',
              body: `${bill.name} for $${bill.amount.toFixed(2)} is ${isOverdue ? 'past due' : 'due today'}.`,
            }
          });
          sentCount++;
        }
      }
    }
    
    // Log success for Vercel Serverless Logs
    res.status(200).json({ success: true, messagesSent: sentCount });
  } catch (error) {
    console.error("Cron Engine Failure:", error);
    res.status(500).json({ error: error.message });
  }
}
