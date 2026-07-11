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
    const { userName, accounts, bills, transactions, currentPeriod } = await req.json();

    // 5. DATA DIET: Slice arrays to prevent token starvation and context bloat
    const safeTransactions = Array.isArray(transactions) ? transactions.slice(0, 15) : [];
    const safeBills = Array.isArray(bills) ? bills.slice(0, 5) : [];

    // 6. Build our elite structured analytics guidelines (STRICTLY MINIFIED)
    const systemInstruction = `You are the ultimate Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0. 
Your objective is to analyze real-time user financial ledger states and produce structured, premium financial metrics.
You must strictly output a valid, completely minified JSON object matching this exact schema with ZERO spaces, ZERO newlines, and ZERO markdown formatting:
{"insightType":"BUDGET INSIGHT","title":"Short punchy header","body":"Highly actionable strategic sentence under 20 words addressing ${userName || 'Founder'} directly.","primaryMetric":"+$4,420","metricLabel":"Potential Savings"}
CRITICAL DIRECTIVE: If the provided ledger arrays are completely empty, DO NOT explain that they are empty. Instantly return this exact default fallback JSON without any deviation: 
{"insightType":"BUDGET INSIGHT","title":"Vault Initialized","body":"Your financial ledger is secure and standing by for your first transaction.","primaryMetric":"$0","metricLabel":"Pending Data"}`;

    const promptText = `Analyze this live financial vault state data to populate your required structured schema keys:
Accounts: ${JSON.stringify(accounts || [])}
Upcoming Bills: ${JSON.stringify(safeBills)}
Recent Activity Ledger: ${JSON.stringify(safeTransactions)}
Evaluation Window: ${currentPeriod || 'AM'}`;

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
      const errorDetails = await response.text();
      throw new Error(`Google API Fault: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    
    // 9. METADATA EXTRACTION: Isolating the exact kill-code from Google's servers
    const candidate = data?.candidates?.[0] || {};
    const rawContent = candidate?.content?.parts?.[0]?.text?.trim() || "";
    const finishReason = candidate?.finishReason || "UNKNOWN";

    let parsedBriefing;
    try {
      if (!rawContent) throw new Error(`Empty AI Response. Flag: ${finishReason}`);
      parsedBriefing = JSON.parse(rawContent);
    } catch (e) {
      // 10. ADVANCED DIAGNOSTIC MIRROR: Forcing the kill-code to print directly to the React UI
      parsedBriefing = {
        insightType: "SYSTEM DIAGNOSTIC",
        title: `Reason: ${finishReason}`,
        body: `ERR: ${e.message} | RAW: ${rawContent.substring(0, 100)}`,
        primaryMetric: "FAIL",
        metricLabel: "Status"
      };
    }

    return new Response(JSON.stringify({ briefing: parsedBriefing }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    // 11. TOP LEVEL DIAGNOSTIC: Capturing fetch fails or API level rejections
    const emergencyBriefing = {
        insightType: "SYSTEM DIAGNOSTIC",
        title: "Server Error",
        body: `ERR: ${error.message.substring(0, 150)}`,
        primaryMetric: "FAIL",
        metricLabel: "Status"
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
