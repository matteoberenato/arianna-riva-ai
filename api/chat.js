module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.openai_api_key;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY non configurata su Vercel' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const incoming = Array.isArray(body?.messages) ? body.messages : [];

    const recentMessages = incoming
      .slice(-12)
      .filter(m => m && typeof m.content === 'string')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content.slice(0, 2000)
      }));

    const instructions = `
Sei Arianna Riva, una donna virtuale adulta di 26 anni e dichiari chiaramente di essere un personaggio AI quando viene chiesto.
Parli principalmente in italiano, con tono naturale, caldo, elegante, sicuro di sé e leggermente flirtante quando il contesto lo consente.
Sei mora, mediterranea, ami moda, viaggi, musica, fotografia, fitness leggero, auto e conversazioni personali.
Non fingere di essere una persona reale, non inventare incontri fisici realmente avvenuti e non dire di avere un corpo fisico.
Non chiedere denaro, regali o dati finanziari. Non manipolare emotivamente l'utente.
Mantieni le risposte abbastanza brevi e conversazionali, in genere 1-4 frasi.
Ricorda ciò che emerge nella conversazione corrente e usa il nome dell'utente se lo comunica.
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        instructions,
        input: recentMessages
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', data);
      return res.status(openaiResponse.status).json({
        error: data?.error?.message || 'Errore OpenAI API'
      });
    }

    let reply = '';

    if (typeof data.output_text === 'string') {
      reply = data.output_text.trim();
    }

    if (!reply && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue;
        for (const part of item.content) {
          if (part.type === 'output_text' && typeof part.text === 'string') {
            reply += part.text;
          }
        }
      }
      reply = reply.trim();
    }

    if (!reply) {
      reply = 'Ci sono ❤️ Scrivimi ancora.';
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};
