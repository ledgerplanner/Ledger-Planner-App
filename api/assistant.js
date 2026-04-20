export default async function handler(req, res) {
  // 1. Block unauthorized access methods
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 2. Security Check
  if (!apiKey) {
    return res.status(500).json({ error: 'Vault Error: API key missing from environment.' });
  }

  try {
    // 3. Ping the stable Gemini 2.5 Flash Model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7,
          maxOutputTokens: 300
        }
      })
    });

    const data = await response.json();
    
    // If Google rejects it, send the EXACT error message to the browser
    if (!response.ok) {
      console.error("Gemini API Error:", data.error);
      return res.status(500).json({ error: data.error?.message || 'Unknown Google API Error' });
    }

    // Extract the exact text response
    const aiText = data.candidates[0].content.parts[0].text;

    // 4. Send it back to the Dashboard
    return res.status(200).json({ reply: aiText });

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return res.status(500).json({ error: error.message || 'Failed to establish neural link.' });
  }
}
