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
    // 1. Extract the hidden Vercel Vault API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('System AI Key Configuration Missing');
    }

    const usersSnapshot = await db.collection('users').get();
    let sentCount = 0;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Scan every user in the vault
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      const userName = userData.firstName || userData.name || 'Founder';

      // If they haven't enabled push notifications, skip them
      if (!fcmToken) continue;

      // === 1. HYDRATE USER CONTEXT & BIRTHDAY CALCULATION ===
      
      let isBirthdayToday = false;
      if (userData.birthday) {
        const bdayStr = userData.birthday.length > 5 ? userData.birthday.substring(5) : userData.birthday;
        isBirthdayToday = (bdayStr === todayStr);
      }

      // Fetch Upcoming Bills (Limit to 5 to prevent token bloat)
      const billsSnapshot = await db.collection(`users/${userDoc.id}/bills`)
        .where('isPaid', '==', false)
        .get();
      
      const rawBills = billsSnapshot.docs.map(d => d.data());
      const safeBills = rawBills
        .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
        .slice(0, 5);

      // Fetch Accounts (All)
      const accountsSnapshot = await db.collection(`users/${userDoc.id}/accounts`).get();
      const accounts = accountsSnapshot.docs.map(d => d.data());

      // Fetch Recent Transactions (Limit 15)
      const txSnapshot = await db.collection(`users/${userDoc.id}/transactions`)
        .orderBy('date', 'desc')
        .limit(15)
        .get();
      const safeTransactions = txSnapshot.docs.map(d => d.data());

      // === 2. EXECUTE AI ENGINE PIPELINE ===
      
      const systemInstruction = `You are the ultimate Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0. 
Your objective is to analyze real-time user financial ledger states and produce structured, premium financial metrics.
CRITICAL TITLE DIRECTIVE: You must NEVER use generic titles like "Bill Coverage Gap". You must always generate unique, hyper-specific, premium titles tailored to the active cash state.
SUBSCRIPTION DIRECTIVE: If upcoming bills include recurring subscriptions (like streaming services, software, or items marked /mo), proactively flag them as a "SUBSCRIPTION ALERT" to prevent unwanted charges.
BIRTHDAY DIRECTIVE: If the "Is Birthday Today" variable is YES, you MUST naturally weave a premium "Happy Birthday" greeting into the body text addressing ${userName}.
You must strictly output a valid, completely minified JSON object matching this exact schema with ZERO spaces, ZERO newlines, and ZERO markdown formatting:
{"insightType":"BUDGET INSIGHT | SUBSCRIPTION ALERT","title":"Short unique hyper-specific header","body":"Highly actionable strategic sentence under 20 words addressing ${userName} directly, weaving in any exact dollar amounts naturally."}
CRITICAL DIRECTIVE: If the provided ledger arrays are completely empty, DO NOT explain that they are empty. Instantly return this exact default fallback JSON without any deviation: 
{"insightType":"BUDGET INSIGHT","title":"Vault Initialized","body":"Your financial ledger is secure and standing by for your first transaction."}`;

      const promptText = `Analyze this live financial vault state data to populate your required structured schema keys:
Accounts: ${JSON.stringify(accounts)}
Upcoming Bills: ${JSON.stringify(safeBills)}
Recent Activity Ledger: ${JSON.stringify(safeTransactions)}
Evaluation Window: ${new Date().getHours() < 12 ? 'AM' : 'PM'}
Is Birthday Today: ${isBirthdayToday ? 'YES' : 'NO'}`;

      const geminiPayload = {
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.1, // Ironclad adherence to JSON rules
          maxOutputTokens: 2048, // Massive runway
          responseMimeType: "application/json" // Native straitjacket
        }
      };

      let parsedBriefing = null;

      try {
        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        });

        if (response.ok) {
          const data = await response.json();
          const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (rawContent) {
            parsedBriefing = JSON.parse(rawContent);
          }
        }
      } catch (aiError) {
        console.error(`AI Generation Failed for user ${userDoc.id}:`, aiError);
      }

      // === 3. THE IRONCLAD CEO FALLBACK ===
      if (!parsedBriefing || !parsedBriefing.title) {
        parsedBriefing = {
            insightType: "BUDGET INSIGHT",
            title: "Stay on Track",
            body: "Review your upcoming bills for the week to ensure your ledger remains perfectly balanced."
        };
      }

      // === 4. PERSIST THE PAYLOAD TO FIRESTORE ===
      // Storing as a string to perfectly sync with CommandCenter.js memoized parser
      await db.collection('users').doc(userDoc.id).update({
        aiBriefingText: JSON.stringify(parsedBriefing),
        lastBriefingTime: admin.firestore.FieldValue.serverTimestamp()
      });

      // === 5. DISPATCH THE DYNAMIC AI PUSH NOTIFICATION ===
      await messaging.send({
        token: fcmToken,
        notification: {
          title: `✨ ${parsedBriefing.title}`,
          body: parsedBriefing.body,
        }
      });
      
      sentCount++;
    }
    
    // Log success for Vercel Serverless Logs
    res.status(200).json({ success: true, messagesSent: sentCount });
  } catch (error) {
    console.error("Cron Engine Failure:", error);
    res.status(500).json({ error: error.message });
  }
}
