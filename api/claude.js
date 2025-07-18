export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

  if (!CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY is missing in environment');
    return res.status(500).json({ error: 'Missing Claude API key' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    // Log the raw response for debugging
    console.log('📦 Claude raw response:', data);

    // Try to extract clean JSON from Claude's text
    let rawText = data?.content?.[0]?.text || '';
    let jsonStart = rawText.indexOf('{');
    let jsonEnd = rawText.lastIndexOf('}');
    let cleanText = rawText.slice(jsonStart, jsonEnd + 1).trim();

    try {
      const parsed = JSON.parse(cleanText);
      return res.status(200).json(parsed);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return res.status(500).json({ error: 'Invalid JSON from Claude', raw: rawText });
    }
  } catch (error) {
    console.error('Claude proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
