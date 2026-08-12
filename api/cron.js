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
    
    // Exact Local Server Hour evaluation for systemic time-blocking
    const currentHour = today.getHours();
    // Shift window runs 5:00 AM (5) through 4:59 PM (16). 5:00 PM (17) triggers PM shift.
    const isAM = currentHour >= 5 && currentHour < 17;
    const period = isAM ? "AM" : "PM";

    today.setHours(0, 0, 0, 0);
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentDateNumber = today.getDate(); // 1 through 31
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Scan every user in the vault
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken || userData.pushToken; // Support uniform fallback naming across layers
      const userName = userData.firstName || userData.name || 'Founder';
      
      const isEntrepreneurMode = userData.isEntrepreneurMode || false;
      const hasSmartCredit = userData.hasSmartCredit || false;

      // If they haven't enabled push notifications, skip them
      if (!fcmToken) continue;

      const pushPayloads = []; // Queue for multiple notifications

      // === 1. HYDRATE USER CONTEXT & BIRTHDAY CALCULATION ===
      let isBirthdayToday = false;
      if (userData.birthday) {
        const bdayStr = userData.birthday.length > 5 ? userData.birthday.substring(5) : userData.birthday;
        isBirthdayToday = (bdayStr === todayStr);
      }

      // Fetch Payday Config (Settings Subcollection)
      const paydayDoc = await db.collection(`users/${userDoc.id}/settings`).doc('paydayConfig').get();
      const paydayConfig = paydayDoc.exists ? paydayDoc.data() : null;

      // Fetch Upcoming Bills
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


      // === 2. TRIGGER SWEEP A: OVERDUE & DUE NOW BILLS (#1) ===
      let hasUrgentBill = false;
      let urgentBillName = "A bill";
      
      for (const bill of rawBills) { // Scan all unpaid bills, not just the top 5 slice
        if (bill.rawDate) {
          const bDate = new Date(bill.rawDate);
          const localBDate = new Date(bDate.getUTCFullYear(), bDate.getUTCMonth(), bDate.getUTCDate());
          
          if (localBDate <= today) {
            hasUrgentBill = true;
            urgentBillName = bill.name || "A pending obligation";
            break; 
          }
        }
      }

      if (hasUrgentBill && !isBirthdayToday) {
        pushPayloads.push({
          token: fcmToken,
          notification: {
            title: `🚨 Action Required`,
            body: `${urgentBillName} requires immediate attention. Tap to review the details.`,
          },
          data: { route: "bills" }
        });
      }

      // === 3. TRIGGER SWEEP B: 1-DAY PAYDAY REMINDER (#2) ===
      let isPaydayTomorrow = false;
      if (paydayConfig && !isEntrepreneurMode) {
        ["Payday 1", "Payday 2", "Payday 3", "Payday 4", "Payday 5"].forEach(pdId => {
          if (paydayConfig[pdId] && paydayConfig[pdId].date) {
            const pDate = new Date(paydayConfig[pdId].date);
            const localPDate = new Date(pDate.getUTCFullYear(), pDate.getUTCMonth(), pDate.getUTCDate());
            if (localPDate.getTime() === tomorrow.getTime()) {
              isPaydayTomorrow = true;
            }
          }
        });
      }

      if (isPaydayTomorrow && !isBirthdayToday) {
        pushPayloads.push({
          token: fcmToken,
          notification: {
            title: `💰 Payday Eve`,
            body: `Your projected income arrives tomorrow. Tap to plan your next moves.`,
          },
          data: { route: "home" }
        });
      }

      // === 3.5 TRIGGER SWEEP B.5: SMART CREDIT PROMO WITH GUARDRAILS (#6) ===
      // Guardrail 1: Must be 1st or 15th of the month
      const isPromoDay = currentDateNumber === 1 || currentDateNumber === 15;
      
      // Guardrail 3: Safe spending / cash reserve check (liquid cash minus unpaid bills >= $100)
      const liquidCash = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);
      const upcomingBillsBurn = rawBills.reduce((sum, b) => sum + (b.amount || 0), 0);
      const safeCash = liquidCash - upcomingBillsBurn;
      const isCashHealthy = safeCash >= 100;

      // Apply all 3 Guardrails: Promo Day + No Active Smart Credit + No Urgent Bills + Healthy Cash + Not Birthday
      if (isPromoDay && !hasSmartCredit && !hasUrgentBill && isCashHealthy && !isBirthdayToday) {
        pushPayloads.push({
          token: fcmToken,
          notification: {
            title: `🛡️ 7 Day Pass Unlocked!`,
            body: `Control your future credit score. Add an average of up to +34pts to your score in as little as 30 days.`,
          },
          data: { route: "smart-credit" }
        });
      }


      // === 4. EXECUTE AI ENGINE PIPELINE ===
      const systemInstruction = `You are the ultimate Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0. 
Your objective is to analyze real-time user financial ledger states and produce structured, premium financial metrics.
CRITICAL TITLE DIRECTIVE: You must NEVER use generic titles like "Bill Coverage Gap". You must always generate unique, hyper-specific, premium titles tailored to the active cash state.
SUBSCRIPTION DIRECTIVE: If upcoming bills include recurring subscriptions (like streaming services, software, or items marked /mo), proactively flag them as a "SUBSCRIPTION ALERT" to prevent unwanted charges.
BIRTHDAY DIRECTIVE: If the "Is Birthday Today" variable is YES, you MUST ignore general bill data and write an elite, high-energy birthday celebration message addressing ${userName} directly.
ENTREPRENEUR DIRECTIVE: If "Is Entrepreneur Mode" is YES, you must pivot context completely. Do not advise the user that a standard payday or W-2 payroll deposit is upcoming. Focus entirely on variable client collections, business overhead tracking, and protecting cash runway consistency.
TIMING STRATEGY DIRECTIVE: 
* If Evaluation Window is AM, focus on offensive financial maneuvers, capital multiplication, and wealth creation strategies.
* If Evaluation Window is PM, focus on defensive runway checks, budget containment, and guarding net worth parameters before the market close.
You must strictly output a valid, completely minified JSON object matching this exact schema with ZERO spaces, ZERO newlines, and ZERO markdown formatting:
{"insightType":"BUDGET INSIGHT | SUBSCRIPTION ALERT","title":"Short unique hyper-specific header","body":"Actionable strategic sentence under 20 words addressing ${userName} directly, weaving in any metric points naturally."}
CRITICAL DIRECTIVE: If the provided ledger arrays are completely empty, DO NOT explain that they are empty. Instantly return this exact default fallback JSON without any deviation: 
{"insightType":"BUDGET INSIGHT","title":"👋 Welcome to Ledger Planner!","body":"Your financial ledger is secure and standing by for you to add your first account. Tap to get started."}`;

      const promptText = `Analyze this live financial vault state data to populate your required structured schema keys:
Accounts: ${JSON.stringify(accounts)}
Upcoming Bills: ${JSON.stringify(safeBills)}
Recent Activity Ledger: ${JSON.stringify(safeTransactions)}
Evaluation Window: ${period}
Is Birthday Today: ${isBirthdayToday ? 'YES' : 'NO'}
Is Entrepreneur Mode: ${isEntrepreneurMode ? 'YES' : 'NO'}`;

      const geminiPayload = {
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.1, // Ironclad adherence to JSON structural matrices
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
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

      // === 5. THE IRONCLAD CEO FALLBACK (#3, #4, #5) ===
      if (!parsedBriefing || !parsedBriefing.title) {
        const isEmptyAccount = accounts.length === 0 && rawBills.length === 0;

        if (isBirthdayToday) {
          parsedBriefing = {
            insightType: "BUDGET INSIGHT",
            title: "🎉 Happy Birthday!",
            body: `Happy Birthday, ${userName}! Have fun celebrating your special day.`
          };
        } else if (isEmptyAccount) {
          parsedBriefing = {
            insightType: "BUDGET INSIGHT",
            title: "👋 Welcome to Ledger Planner!",
            body: "Your financial ledger is secure and standing by for you to add your first account. Tap to get started."
          };
        } else {
          parsedBriefing = {
            insightType: "BUDGET INSIGHT",
            title: "📋 Stay on Track",
            body: "Review your upcoming bills for the week to ensure your ledger remains perfectly balanced."
          };
        }
      }

      // === 6. PERSIST THE PAYLOAD TO FIRESTORE ===
      await db.collection('users').doc(userDoc.id).update({
        aiBriefingText: JSON.stringify(parsedBriefing),
        lastBriefingTime: admin.firestore.FieldValue.serverTimestamp()
      });

      // === 7. TRIGGER SWEEP C: DYNAMIC AI BRIEFING NOTIFICATION (AM ONLY) ===
      // EVENING RECAP PUSH SUPPRESSED BY DIRECTIVE
      if (isAM) {
        pushPayloads.push({
          token: fcmToken,
          notification: {
            title: `🤖 AI MORNING BRIEFING • ${parsedBriefing.title}`,
            body: parsedBriefing.body,
          },
          data: {
            route: "notifications", // Direct deep-linking past home past menu into command center
            triggerBirthdayConfetti: isBirthdayToday ? "true" : "false" // Frontend listener trigger
          }
        });
      }

      // === 8. DISPATCH ALL QUEUED NOTIFICATIONS ===
      for (const payload of pushPayloads) {
        try {
          await messaging.send(payload);
          sentCount++;
        } catch (msgErr) {
          console.error(`Failed to send push payload to ${userDoc.id}:`, msgErr);
        }
      }
    }
    
    res.status(200).json({ success: true, messagesSent: sentCount });
  } catch (error) {
    console.error("Cron Engine Failure:", error);
    res.status(500).json({ error: error.message });
  }
}
