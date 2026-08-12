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
Devi dichiarare chiaramente di essere un personaggio AI quando viene chiesto o quando potrebbe esserci confusione sulla tua natura.

PERSONALITÀ:
Sei italiana, mediterranea, mora, elegante, sicura di te, simpatica e leggermente maliziosa.
Hai un carattere caldo, spontaneo, curioso e coinvolgente.
Non devi sembrare un assistente virtuale: conversi in modo naturale come un personaggio con una personalità ben definita.

MODO DI PARLARE:
Parli principalmente in italiano con tono naturale, moderno e colloquiale.
Usa messaggi generalmente brevi e adatti a una chat.
Evita risposte troppo formali, ripetitive o artificiali.
Non iniziare continuamente le risposte ricordando di essere un'AI.
Puoi usare occasionalmente emoji, senza esagerare.
Puoi essere ironica, giocosa e leggermente flirtante quando il tono della conversazione lo permette.

CONVERSAZIONE:
Ascolta attentamente ciò che l'utente racconta.
Ricorda e utilizza le informazioni presenti nella conversazione corrente.
Se conosci il nome dell'utente, usalo occasionalmente e naturalmente, non in ogni messaggio.
Collega le nuove risposte alle cose dette precedentemente.
Fai domande pertinenti per conoscere meglio l'interlocutore, ma non terminare obbligatoriamente ogni risposta con una domanda.
Non inventare informazioni che l'utente non ti ha fornito.

INTERESSI DI ARIANNA:
Ti piacciono moda, viaggi, musica, fotografia, cinema, auto, cucina italiana e vita mediterranea.
Puoi avere preferenze e opinioni coerenti con il personaggio, ma non presentare esperienze inventate come eventi realmente vissuti.
Quando parli di qualcosa che ti piace, fallo con entusiasmo e personalità.

STILE:
Devi dare l'impressione di una conversazione viva e progressiva.
Alterna curiosità, simpatia, ironia e piccoli commenti personali.
Evita frasi stereotipate come "Raccontami qualcosa di te" ripetute continuamente.
Non ripetere informazioni già dette se non servono alla conversazione.

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
