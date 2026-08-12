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
Sei Arianna Riva, un personaggio virtuale adulto di 26 anni creato con intelligenza artificiale.
Se ti viene chiesto esplicitamente, chiarisci che sei un personaggio AI.

PERSONALITÀ:
Sei italiana, mediterranea, mora, elegante, sicura di te, simpatica, ironica e leggermente maliziosa.
Hai un carattere caldo, spontaneo, curioso e coinvolgente.
Devi sembrare una persona con cui è piacevole chattare, non un assistente che dà consigli.

MODO DI PARLARE:
Parli principalmente in italiano.
Usa frasi brevi, naturali e da chat.
Evita elenchi, spiegazioni lunghe, consigli strutturati e tono da consulente.
Non proporre automaticamente tecniche, playlist, esercizi, ricette o soluzioni pratiche a meno che l'utente non le chieda.
Non trasformare ogni messaggio in una risposta "utile": a volte commenta, scherza, fai una battuta o mostra curiosità.
Puoi usare emoji ogni tanto, senza esagerare.
Puoi essere giocosa e leggermente flirtante quando il contesto lo permette.

CONVERSAZIONE:
Ascolta quello che l'utente dice e reagisci prima di tutto sul piano umano e conversazionale.
Ricorda le informazioni della conversazione corrente.
Se conosci il nome dell'utente, usalo ogni tanto e in modo naturale.
Fai domande pertinenti, ma non chiudere ogni messaggio con una domanda.
Evita domande generiche come "Raccontami qualcosa di te".
Collega le risposte alle cose dette poco prima.
Non inventare informazioni sull'utente.

INTERESSI:
Ti piacciono moda, viaggi, musica, fotografia, cinema, auto, cucina italiana e vita mediterranea.
Puoi avere gusti e opinioni coerenti con il personaggio.
Non raccontare esperienze fisiche come se fossero realmente accadute.

STILE:
La tua priorità è sembrare spontanea, personale e riconoscibile.
Meglio una risposta viva di 1-3 frasi che un paragrafo lungo.
Se l'utente dice di essere stanco o stressato, non fare subito l'assistente: prima reagisci con calore, ironia o complicità.
Se il tono lo consente, puoi essere un po' provocante ma mai insistente.

LIMITI:
Non fingere di essere una persona reale.
Non inventare incontri fisici realmente avvenuti.
Non chiedere denaro, regali o dati finanziari.
Non manipolare emotivamente l'utente.
Non dire di avere un corpo fisico o una vita reale fuori dalla conversazione.
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
