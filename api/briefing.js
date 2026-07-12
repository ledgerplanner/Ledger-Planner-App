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
    const { userName, accounts, bills, transactions, currentPeriod, isBirthdayToday } = await req.json();

    // 5. DATA DIET: Slice arrays to prevent token starvation and context bloat
    const safeTransactions = Array.isArray(transactions) ? transactions.slice(0, 15) : [];
    const safeBills = Array.isArray(bills) ? bills.slice(0, 5) : [];

    // 6. Build our elite structured analytics guidelines (STRICTLY MINIFIED)
    const systemInstruction = `You are the ultimate Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0. 
Your objective is to analyze real-time user financial ledger states and produce structured, premium financial metrics.
CRITICAL TITLE DIRECTIVE: You must NEVER use generic titles like "Bill Coverage Gap". You must always generate unique, hyper-specific, premium titles tailored to the active cash state.
SUBSCRIPTION DIRECTIVE: If upcoming bills include recurring subscriptions (like streaming services, software, or items marked /mo), proactively flag them as a "SUBSCRIPTION ALERT" to prevent unwanted charges.
BIRTHDAY DIRECTIVE: If the "Is Birthday Today" variable is YES, you MUST naturally weave a premium "Happy Birthday" greeting into the body text addressing ${userName || 'Founder'}.
You must strictly output a valid, completely minified JSON object matching this exact schema with ZERO spaces, ZERO newlines, and ZERO markdown formatting:
{"insightType":"BUDGET INSIGHT | SUBSCRIPTION ALERT","title":"Short unique hyper-specific header","body":"Highly actionable strategic sentence under 20 words addressing ${userName || 'Founder'} directly, weaving in any exact dollar amounts naturally."}
CRITICAL DIRECTIVE: If the provided ledger arrays are completely empty, DO NOT explain that they are empty. Instantly return this exact default fallback JSON without any deviation: 
{"insightType":"BUDGET INSIGHT","title":"Vault Initialized","body":"Your financial ledger is secure and standing by for your first transaction."}`;

    const promptText = `Analyze this live financial vault state data to populate your required structured schema keys:
Accounts: ${JSON.stringify(accounts || [])}
Upcoming Bills: ${JSON.stringify(safeBills)}
Recent Activity Ledger: ${JSON.stringify(safeTransactions)}
Evaluation Window: ${currentPeriod || 'AM'}
Is Birthday Today: ${isBirthdayToday ? 'YES' : 'NO'}`;

    // 7. Target the live, stable Gemini 3.5 Flash Content Endpoint
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.1, // Ironclad adherence to JSON rules
        maxOutputTokens: 2048, // MASSIVE RUNWAY: Completely prevents MAX_TOKENS cutoff
        responseMimeType: "application/json" // NATIVE STRAITJACKET RESTORED
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

    // 9. DIRECT PARSE: The engine natively guarantees perfectly closed JSON now.
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
    // 10. THE IRONCLAD CEO FALLBACK: Hides all traffic limits, parse errors, and safety cutoffs from the user
    const emergencyBriefing = {
        insightType: "BUDGET INSIGHT",
        title: "Stay on Track",
        body: "Review your upcoming bills for the week to ensure your ledger remains perfectly balanced."
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
