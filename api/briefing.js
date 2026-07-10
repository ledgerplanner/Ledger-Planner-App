// api/briefing.js
// VERCEL SERVERLESS EDGE ROUTE FOR LP 2.0 TWICE-DAILY AI WEALTH STRATEGIST

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

    // 5. Build our highly customized, elite wealth strategist prompt guidelines
    const systemInstruction = `You are the ultimate Lead Financial Architect and elite wealth strategist inside Ledger Planner 2.0. 
Your objective is to provide a brief, high-impact, actionable financial brief for the user based on their current data.
- Keep the briefing strictly under 3 sentences. Be punchy, clear, and direct.
- Do not use markdown bolding formatting (like **) or bullets in your sentence text block.
- Address the user directly by their name: ${userName || 'Founder'}.
- Review their accounts data, upcoming bills, and recent transactions to pinpoint trends, anomalies, optimization strategies, or critical due dates.
- Current Time Horizon: This is their ${currentPeriod || 'current'} evaluation window.`;

    const promptText = `Analyze this real-time financial ledger state data and produce my briefing:
Accounts: ${JSON.stringify(accounts || [])}
Upcoming Bills: ${JSON.stringify(bills || [])}
Recent Activity Ledger: ${JSON.stringify(transactions || [])}`;

    // 6. Build request payload matching Google AI Studio's generation API layout
    // SURGICAL FIX: Upgraded endpoint to gemini-2.5-flash
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 250
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
    
    // 8. Safely extract raw text block from Gemini structure response
    const generatedBriefing = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
      "Ledger engine running optimal velocity pipelines. Continue monitoring accounts normally.";

    // 9. Send response back down to frontend client
    return new Response(JSON.stringify({ briefing: generatedBriefing }), {
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
