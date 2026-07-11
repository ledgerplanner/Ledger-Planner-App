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
      return new Response(JSON.stringify({ error: 'System AI Key Configuration Missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Ingest financial metrics sent from the frontend client
    const { userName, accounts, bills, transactions, currentPeriod } = await req.json();

    // 5. Build our elite structured analytics guidelines
    const systemInstruction = `You are the ultimate Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0. 
Your objective is to analyze real-time user financial ledger states and produce structured, premium financial metrics.
You must return your response as a raw JSON object following this schema exactly, with no additional text or markdown formatting:
{
  "insightType": "BUDGET INSIGHT" | "SUBSCRIPTION ALERT" | "SPENDING TREND",
  "title": "A short, punchy header under 5 words",
  "body": "A highly actionable strategic sentence under 20 words addressing ${userName || 'Founder'} directly based on real data metrics.",
  "primaryMetric": "A string representing money values, percentages, or ratios (e.g., '+$4,420', '$120/mo', '18%')",
  "metricLabel": "A short context label for the primaryMetric (e.g., 'Potential Savings', 'Spending Increase', 'Monthly Cost')"
}
Do not use markdown blocks (such as \`\`\`json). Return only the raw minified JSON payload block. Check your mathematical calculations against the ledger data before writing.`;

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
        temperature: 0.2, // Low temperature enforces rigid adherence to formatting rules
        maxOutputTokens: 300
        // STRICT FIX: responseMimeType removed. The mechanical slicer handles raw text extraction without choking the engine.
      }
    };

    // 7. Execute secure background relay operation
    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      return new Response(JSON.stringify({ error: 'Google Engine API Fault', details: errorDetails }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // STRICT FIX: Mechanical index slicing to isolate the JSON object and destroy all conversational filler
    let sanitizedJsonText = "";
    const startIndex = rawContent.indexOf('{');
    const endIndex = rawContent.lastIndexOf('}');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      sanitizedJsonText = rawContent.substring(startIndex, endIndex + 1);
    }

    // 8. Parse and pass secure structured objects down to frontend context
    let parsedBriefing;
    try {
      if (!sanitizedJsonText) throw new Error("No valid JSON structure found in AI response.");
      parsedBriefing = JSON.parse(sanitizedJsonText);
    } catch (e) {
      // PREMIUM CEO FALLBACK: Graceful degradation to a natural financial tip
      parsedBriefing = {
        insightType: "BUDGET INSIGHT",
        title: "Stay on Track",
        body: "Review your upcoming bills for the week to ensure your ledger remains perfectly balanced.",
        primaryMetric: "Review",
        metricLabel: "Action Required"
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
    return new Response(JSON.stringify({ error: 'Internal Relay Exception Handler Triggered', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
