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

    // 5. Build our elite structured analytics guidelines with Empty-Data safety net
    const systemInstruction = `You are the ultimate Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0. 
Your objective is to analyze real-time user financial ledger states and produce structured, premium financial metrics.
You must strictly output a valid JSON object matching this exact schema:
{
  "insightType": "BUDGET INSIGHT" | "SUBSCRIPTION ALERT" | "SPENDING TREND",
  "title": "A short, punchy header under 5 words",
  "body": "A highly actionable strategic sentence under 20 words addressing ${userName || 'Founder'} directly based on real data metrics.",
  "primaryMetric": "A string representing money values, percentages, or ratios (e.g., '+$4,420', '$120/mo', '18%')",
  "metricLabel": "A short context label for the primaryMetric (e.g., 'Potential Savings', 'Spending Increase', 'Monthly Cost')"
}
CRITICAL DIRECTIVE: If the provided ledger arrays (Accounts, Upcoming Bills, Recent Activity) are completely empty, DO NOT explain that they are empty. Instantly return this exact default fallback JSON without any deviation: 
{"insightType": "BUDGET INSIGHT", "title": "Vault Initialized", "body": "Your financial ledger is secure and standing by for your first transaction.", "primaryMetric": "$0", "metricLabel": "Pending Data"}`;

    const promptText = `Analyze this live financial vault state data to populate your required structured schema keys:
Accounts: ${JSON.stringify(accounts || [])}
Upcoming Bills: ${JSON.stringify(bills || [])}
Recent Activity Ledger: ${JSON.stringify(transactions || [])}
Evaluation Window: ${currentPeriod || 'AM'}`;

    // 6. Target the live, stable Gemini 3.5 Flash Content Endpoint
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
        maxOutputTokens: 600,
        responseMimeType: "application/json" // NATIVE STRAITJACKET RESTORED: Guarantees perfect syntax
      }
    };

    // 7. Execute secure background relay operation
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

    // 8. DIRECT PARSE: Slicer deleted. The engine natively guarantees perfectly closed JSON now.
    let parsedBriefing;
    try {
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
    // 9. THE IRONCLAD CEO FALLBACK: Hides all traffic limits, parse errors, and safety cutoffs from the user
    const emergencyBriefing = {
        insightType: "BUDGET INSIGHT",
        title: "Stay on Track",
        body: "Review your upcoming bills for the week to ensure your ledger remains perfectly balanced.",
        primaryMetric: "Review",
        metricLabel: "Action Required"
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
