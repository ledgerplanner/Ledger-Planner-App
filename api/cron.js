import admin from 'firebase-admin';

// Securely initialize Firebase Admin using Vercel Environment Variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

const db = admin.firestore();
const messaging = admin.messaging();

export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[LP Cron Engine] Missing GEMINI_API_KEY in environment variables.');
      throw new Error('System AI Key Configuration Missing');
    }

    const usersSnapshot = await db.collection('users').get();
    let sentCount = 0;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
    const today = new Date();
    
    // Shift window: 5:00 AM (5) through 4:59 PM (16) is AM. 5:00 PM (17) triggers PM shift.
    const currentHour = today.getHours();
    const isAM = currentHour >= 5 && currentHour < 17;
    const period = isAM ? "AM" : "PM";

    today.setHours(0, 0, 0, 0);
    const todayMillis = today.getTime();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentDateNumber = today.getDate();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken || userData.pushToken;
      const userName = userData.firstName || userData.name || 'Founder';
      
      const isEntrepreneurMode = userData.isEntrepreneurMode || false;
      const hasSmartCredit = userData.hasSmartCredit || false;

      if (!fcmToken) continue;

      const pushPayloads = [];

      // === 1. HYDRATE USER CONTEXT & BIRTHDAY CALCULATION ===
      let isBirthdayToday = false;
      let isBirthdayEve = false;
      if (userData.birthday) {
        const bdayStr = userData.birthday.length > 5 ? userData.birthday.substring(5) : userData.birthday;
        isBirthdayToday = (bdayStr === todayStr);
        isBirthdayEve = (bdayStr === tomorrowStr);
      }

      // Fetch Payday Config
      const paydayDoc = await db.collection(`users/${userDoc.id}/settings`).doc('paydayConfig').get();
      const paydayConfig = paydayDoc.exists ? paydayDoc.data() : null;

      // Fetch Upcoming Bills
      const billsSnapshot = await db.collection(`users/${userDoc.id}/bills`)
        .where('isPaid', '==', false)
        .get();
      
      const rawBills = billsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const safeBills = rawBills
        .sort((a, b) => new Date(a.rawDate || 0) - new Date(b.rawDate || 0))
        .slice(0, 5);

      // Fetch Accounts
      const accountsSnapshot = await db.collection(`users/${userDoc.id}/accounts`).get();
      const accounts = accountsSnapshot.docs.map(d => d.data());

      // Fetch Recent Transactions
      const txSnapshot = await db.collection(`users/${userDoc.id}/transactions`)
        .orderBy('date', 'desc')
        .limit(15)
        .get();
      const safeTransactions = txSnapshot.docs.map(d => d.data());

      // === 2. TRIGGER SWEEP A: OVERDUE & DUE TODAY BILLS ===
      let hasUrgentBill = false;
      let urgentBillName = "A bill";
      
      for (const bill of rawBills) {
        if (bill.rawDate) {
          const parts = bill.rawDate.split("-");
          if (parts.length === 3) {
            const billDate = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
            billDate.setHours(0, 0, 0, 0);
            
            if (billDate.getTime() <= todayMillis) {
              hasUrgentBill = true;
              urgentBillName = bill.name || "A pending obligation";
              break; 
            }
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
          data: { 
            route: "bills",
            url: "/?tab=bills",
            tag: `lp-urgent-bill-${Date.now()}`
          }
        });
      }

      // === 2.5 TRIGGER SWEEP A.5: BILL REMINDERS ===
      if (!isBirthdayToday) {
        for (const bill of rawBills) {
          if (bill.rawDate) {
            const hasReminderSet = bill.hasReminder !== false;
            const reminderDays = bill.reminderDays !== undefined ? Number(bill.reminderDays) : 2;
            
            const parts = bill.rawDate.split("-");
            if (parts.length === 3) {
              const billDate = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
              billDate.setHours(0, 0, 0, 0);
              const diffDays = Math.round((billDate.getTime() - todayMillis) / (1000 * 60 * 60 * 24));

              if (hasReminderSet && diffDays > 0 && diffDays <= reminderDays) {
                const dayLabel = diffDays === 1 ? "tomorrow" : `in ${diffDays} days`;
                pushPayloads.push({
                  token: fcmToken,
                  notification: {
                    title: `🔔 Upcoming Bill: ${bill.name || 'Bill'}`,
                    body: `$${(Number(bill.amount) || 0).toFixed(2)} is due ${dayLabel}. Tap to view your plan.`,
                  },
                  data: { 
                    route: "bills",
                    url: "/?tab=bills",
                    tag: `lp-reminder-${bill.id}-${diffDays}d`
                  }
                });
              }
            }
          }
        }
      }

      // === 3. TRIGGER SWEEP B: PAYDAY EVE REMINDER ===
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
          data: { 
            route: "home",
            url: "/?tab=home",
            tag: `lp-payday-eve-${Date.now()}`
          }
        });
      }

      // === 3.5 TRIGGER SWEEP B.5: SMART CREDIT PROMO ===
      const isPromoDay = currentDateNumber === 1 || currentDateNumber === 15;
      const liquidCash = accounts.filter(a => !a.isGoal && (a.type === "Checking" || a.type === "Cash")).reduce((sum, acc) => sum + (acc.balance || 0), 0);
      const upcomingBillsBurn = rawBills.reduce((sum, b) => sum + (b.amount || 0), 0);
      const safeCash = liquidCash - upcomingBillsBurn;
      const isCashHealthy = safeCash >= 100;

      if (isPromoDay && !hasSmartCredit && !hasUrgentBill && isCashHealthy && !isBirthdayToday) {
        pushPayloads.push({
          token: fcmToken,
          notification: {
            title: `🛡️ 7 Day Pass Unlocked!`,
            body: `Control your future credit score. Add an average of up to +34pts to your score in as little as 30 days.`,
          },
          data: { 
            route: "smart-credit",
            url: "/?tab=accounts",
            tag: `lp-smart-credit-promo-${currentDateNumber}`
          }
        });
      }

      // === 4. EXECUTE AI PIPELINE ===
      const systemInstruction = `You are the Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0 powered by Gemini 3.8 Flash.
Your objective is to analyze real-time user financial ledger states and produce structured, premium financial metrics with sharp strategic reasoning.
CRITICAL TITLE DIRECTIVE: You must NEVER use generic titles like "Bill Coverage Gap". You must always generate unique, hyper-specific, premium titles tailored to the active cash state.
SUBSCRIPTION DIRECTIVE: If upcoming bills include recurring subscriptions (like streaming services, software, or items marked /mo), proactively flag them as a "SUBSCRIPTION ALERT" to prevent unwanted charges.
BIRTHDAY DIRECTIVES:
* If "Is Birthday Today" is YES: Open with an elite, celebratory birthday message addressing ${userName} directly before reviewing runway.
* If "Is Birthday Eve" is YES: Open with an exciting Birthday Eve acknowledgment addressing ${userName} directly, ensuring peace of mind ahead of their celebration.
ENTREPRENEUR DIRECTIVE: If "Is Entrepreneur Mode" is YES, pivot context completely. Do not advise that a standard payday or W-2 payroll deposit is upcoming. Focus entirely on variable client collections, business overhead tracking, and protecting cash runway consistency.
TIMING STRATEGY DIRECTIVE: 
* If Evaluation Window is AM, focus on Morning Outlook: capital multiplication, liquidity runway, upcoming obligations, and a high-impact Next Best Move.
* If Evaluation Window is PM, focus on Evening Recap: defensive runway containment, guarding net worth parameters, and end-of-day reconciliation.
LENGTH DIRECTIVE: The 'body' field MUST contain at least 3 distinct, high-value sentences:
Sentence 1: Live cash status and liquidity assessment.
Sentence 2: Immediate operational focus or upcoming bill priority.
Sentence 3: A decisive, high-impact "Next Best Move" recommendation.
CRITICAL DIRECTIVE: If the provided ledger arrays are completely empty, return insightType as "BUDGET INSIGHT", title as "Vault Initialized", and body as "Your financial ledger is secure and standing by for your first transaction. Connect your accounts to begin telemetry. We are ready when you are."`;

      const promptText = `Analyze this live financial vault state data to populate your required structured schema keys:
Accounts: ${JSON.stringify(accounts)}
Upcoming Bills: ${JSON.stringify(safeBills)}
Recent Activity Ledger: ${JSON.stringify(safeTransactions)}
Payday Calendar & Projections: ${JSON.stringify(paydayConfig || {})}
Evaluation Window: ${period}
Is Birthday Today: ${isBirthdayToday ? 'YES' : 'NO'}
Is Birthday Eve: ${isBirthdayEve ? 'YES' : 'NO'}
Is Entrepreneur Mode: ${isEntrepreneurMode ? 'YES' : 'NO'}`;

      const geminiPayload = {
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              insightType: {
                type: "STRING",
                enum: ["BUDGET INSIGHT", "SUBSCRIPTION ALERT"]
              },
              title: {
                type: "STRING"
              },
              body: {
                type: "STRING"
              }
            },
            required: ["insightType", "title", "body"]
          }
        }
      };

      let parsedBriefing = null;

      try {
        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[LP Cron Engine] Google API error (${response.status}) for user ${userDoc.id}:`, errText);
        } else {
          const data = await response.json();
          const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (rawContent) {
            parsedBriefing = JSON.parse(rawContent);
          }
        }
      } catch (aiError) {
        console.error(`[LP Cron Engine] AI generation exception for user ${userDoc.id}:`, aiError);
      }

      // === 5. THE IRONCLAD CEO FALLBACK ===
      if (!parsedBriefing || !parsedBriefing.title) {
        const isEmptyAccount = accounts.length === 0 && rawBills.length === 0;

        if (isBirthdayToday) {
          parsedBriefing = {
            insightType: "BUDGET INSIGHT",
            title: "🎉 Happy Birthday!",
            body: `Happy Birthday, ${userName}! Have fun celebrating your special day.`
          };
        } else if (isBirthdayEve) {
          parsedBriefing = {
            insightType: "BUDGET INSIGHT",
            title: "🎂 Birthday Eve!",
            body: `Tomorrow is your Birthday, ${userName}! The Ledger Planner team is ready to celebrate with you.`
          };
        } else if (isEmptyAccount) {
          parsedBriefing = {
            insightType: "BUDGET INSIGHT",
            title: "Vault Initialized",
            body: "Your financial ledger is secure and standing by for your first transaction. Connect your accounts to begin telemetry. We are ready when you are."
          };
        } else {
          parsedBriefing = {
            insightType: "BUDGET INSIGHT",
            title: "Stay on Track",
            body: "Your financial ledger is currently secure and balanced. Review your upcoming bills for the week to ensure zero coverage gaps. Maintain your defensive posture until the next cycle drops."
          };
        }
      }

      // === 6. PERSIST TO FIRESTORE ===
      await db.collection('users').doc(userDoc.id).update({
        aiBriefingText: JSON.stringify(parsedBriefing),
        lastBriefingTime: admin.firestore.FieldValue.serverTimestamp()
      });

      // === 7. DISPATCH DYNAMIC AI NOTIFICATION (AM ONLY) ===
      if (isAM) {
        pushPayloads.push({
          token: fcmToken,
          notification: {
            title: `🤖 AI MORNING BRIEFING • ${parsedBriefing.title}`,
            body: parsedBriefing.body,
          },
          data: {
            route: "notifications",
            url: "/?tab=notifications",
            triggerBirthdayConfetti: isBirthdayToday ? "true" : "false",
            tag: `lp-ai-briefing-${Date.now()}`
          }
        });
      }

      // === 8. DISPATCH QUEUED NOTIFICATIONS ===
      for (const payload of pushPayloads) {
        try {
          await messaging.send(payload);
          sentCount++;
        } catch (msgErr) {
          console.error(`[LP Cron Engine] Push dispatch error for user ${userDoc.id}:`, msgErr);
        }
      }
    }
    
    res.status(200).json({ success: true, messagesSent: sentCount });
  } catch (error) {
    console.error("[LP Cron Engine Critical Failure]:", error);
    res.status(500).json({ error: error.message });
  }
}
