// api/briefing.js
// VERCEL SERVERLESS EDGE ROUTE FOR LP 2.0 TWICE-DAILY AI WEALTH STRATEGIST (STRUCTURED ANALYTICS ENGINE)

export const config = {
  runtime: 'edge', // Utilizing ultra-low latency Edge runtime
};

export default async function handler(req) {
  // 1. Handle CORS Preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // 2. Restrict to secure POST payloads only
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 3. Extract the hidden Vercel Vault API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('System AI Key Configuration Missing');
    }

    // 4. Ingest financial metrics sent from the frontend client
    const { userName, accounts, bills, transactions, currentPeriod, isBirthdayToday, isBirthdayEve, isEntrepreneurMode } = await req.json();

    // 5. DATA DIET: Slice arrays to prevent token starvation and context bloat
    const safeTransactions = Array.isArray(transactions) ? transactions.slice(0, 15) : [];
    const safeBills = Array.isArray(bills) ? bills.slice(0, 5) : [];

    // 6. Build our elite structured analytics guidelines (STRICTLY MINIFIED)
    const systemInstruction = `You are the ultimate Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0 powered by Gemini 3.7.
Your objective is to analyze real-time user financial ledger states and produce structured, premium financial metrics with sharp strategic reasoning.
CRITICAL TITLE DIRECTIVE: You must NEVER use generic titles like "Bill Coverage Gap". You must always generate unique, hyper-specific, premium titles tailored to the active cash state.
SUBSCRIPTION DIRECTIVE: If upcoming bills include recurring subscriptions (like streaming services, software, or items marked /mo), proactively flag them as a "SUBSCRIPTION ALERT" to prevent unwanted charges.
BIRTHDAY DIRECTIVES:
* If "Is Birthday Today" is YES: Open with an elite, celebratory birthday message addressing ${userName || 'Founder'} directly before reviewing runway.
* If "Is Birthday Eve" is YES: Open with an exciting Birthday Eve acknowledgment addressing ${userName || 'Founder'} directly, ensuring peace of mind ahead of their celebration.
ENTREPRENEUR DIRECTIVE: If "Is Entrepreneur Mode" is YES, pivot context completely. Do not advise that a standard payday or W-2 payroll deposit is upcoming. Focus entirely on variable client collections, business overhead tracking, and protecting cash runway consistency.
EVALUATION WINDOW DIRECTIVE: If Evaluation Window is AM, focus on the Morning Outlook (upcoming bills, daily budget limit, paydays). If PM, focus on the Evening Recap (spending highlights, budget impact, staying on track).
LENGTH & STRATEGY DIRECTIVE: The 'body' field MUST contain at least 3 distinct, high-value sentences:
Sentence 1: Live cash status and liquidity assessment.
Sentence 2: Immediate operational focus or upcoming bill priority.
Sentence 3: A decisive, high-impact "Next Best Move" recommendation.
You must strictly output a valid, completely minified JSON object matching this exact schema with ZERO spaces, ZERO newlines, and ZERO markdown formatting:
{"insightType":"BUDGET INSIGHT | SUBSCRIPTION ALERT","title":"Short unique hyper-specific header","body":"Three or more complete, highly actionable strategic sentences addressing ${userName || 'Founder'} directly, weaving in exact dollar amounts naturally."}
CRITICAL DIRECTIVE: If the provided ledger arrays are completely empty, DO NOT explain that they are empty. Instantly return this exact default fallback JSON without any deviation: 
{"insightType":"BUDGET INSIGHT","title":"Vault Initialized","body":"Your financial ledger is secure and standing by for your first transaction. Connect your accounts to begin telemetry. We are ready when you are."}`;

    const promptText = `Analyze this live financial vault state data to populate your required structured schema keys:
Accounts: ${JSON.stringify(accounts || [])}
Upcoming Bills: ${JSON.stringify(safeBills)}
Recent Activity Ledger: ${JSON.stringify(safeTransactions)}
Evaluation Window: ${currentPeriod || 'AM'}
Is Birthday Today: ${isBirthdayToday ? 'YES' : 'NO'}
Is Birthday Eve: ${isBirthdayEve ? 'YES' : 'NO'}
Is Entrepreneur Mode: ${isEntrepreneurMode ? 'YES' : 'NO'}`;

    // 7. Target the cutting-edge Gemini 3.7 Flash Content Endpoint
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.1, // Ironclad adherence to JSON rules
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    };

    // 8. Execute secure background relay operation
    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      throw new Error('Google Engine API Fault or Network Cutoff');
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // 9. DIRECT PARSE: Guarantees perfectly closed JSON
    let parsedBriefing;
    try {
      if (!rawContent) throw new Error("Empty response");
      parsedBriefing = JSON.parse(rawContent);
    } catch (e) {
      throw new Error('Final Parse Exception');
    }

    return new Response(JSON.stringify({ briefing: parsedBriefing }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    // 10. THE IRONCLAD CEO FALLBACK: Protects user from traffic limits, parse errors, and safety cutoffs
    const emergencyBriefing = {
        insightType: "BUDGET INSIGHT",
        title: "Stay on Track",
        body: "Your financial ledger is currently secure and balanced. Review your upcoming bills for the week to ensure zero coverage gaps. Maintain your defensive posture until the next cycle drops."
    };
    
    return new Response(JSON.stringify({ briefing: emergencyBriefing }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
