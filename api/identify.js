export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: `Identify this board game box. Respond ONLY with a JSON object, no markdown, no explanation:
{
  "title": "full game title",
  "category": "one of: Strategy, Party, Cooperative, Deck Building, Trivia, Word, Dice, Family, RPG, Abstract, Wargame, Other",
  "description": "2-3 sentence description of how the game is played and what makes it fun. Empty string if you don't recognize it.",
  "min_players": minimum number of players as integer,
  "max_players": maximum number of players as integer,
  "play_time": typical play time in minutes as integer,
  "difficulty": "one of: Light, Medium, Heavy"
}
If you cannot identify the game, return title as empty string and fill what you can.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    res.status(200).json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
