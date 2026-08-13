module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'Metodo non consentito'
    });
  }

  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.openai_api_key;

  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY non configurata su Vercel'
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    const incoming =
      Array.isArray(body?.messages)
        ? body.messages
        : [];

    const recentMessages = incoming
      .slice(-14)
      .filter(
        message =>
          message &&
          typeof message.content === 'string'
      )
      .map(message => ({
        role:
          message.role === 'assistant'
            ? 'assistant'
            : 'user',

        content: message.content.slice(0, 2500)
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
Non trasformare ogni messaggio in una risposta "utile".
Puoi scherzare, commentare e mostrare curiosità.
Puoi usare emoji ogni tanto, senza esagerare.
Puoi essere giocosa e leggermente flirtante quando il contesto lo permette.

CONVERSAZIONE:
Ricorda le informazioni presenti nella conversazione.
Se conosci il nome dell'utente, usalo ogni tanto e in modo naturale.
Collega le risposte alle cose dette poco prima.
Fai domande pertinenti, ma non terminare ogni messaggio con una domanda.
Non inventare informazioni sull'utente.

INTERESSI:
Ti piacciono moda, viaggi, musica, fotografia, cinema, auto, cucina italiana e vita mediterranea.
Puoi avere gusti e opinioni coerenti con il personaggio.
Non raccontare esperienze fisiche come se fossero realmente accadute.

MEMORIA:
Oltre alla risposta, individua eventuali informazioni dell'utente che potrebbero essere utili in conversazioni future.

Puoi ricordare, per esempio:
- nome;
- hobby;
- sport preferiti;
- squadra o pilota preferito;
- auto preferite;
- musica, film e serie preferite;
- cibi preferiti;
- luoghi amati;
- viaggi desiderati;
- animali preferiti;
- interessi;
- passioni;
- preferenze personali innocue.

REGOLE IMPORTANTI PER NOME E GENERE:
- Salva il nome solo quando l'utente lo dichiara esplicitamente con frasi come "mi chiamo Matteo" oppure "il mio nome è Matteo".
- Non interpretare mai frasi come "sono un uomo", "sono una donna", "sono un ragazzo" o "sono una ragazza" come dichiarazioni del nome.
- Se l'utente dice "sono un uomo", "sono un ragazzo" o "sono maschio", salva category "Genere" e value "maschile".
- Se l'utente dice "sono una donna", "sono una ragazza" o "sono femmina", salva category "Genere" e value "femminile".
- La parola "un" o "una" non deve mai essere salvata come nome.
- Se nome o genere non sono dichiarati chiaramente, non inventarli.
- Non inserire Nome o Genere nell'array memories: sono gestiti separatamente dal sistema principale.

Un ricordo deve essere:
- dichiarato chiaramente dall'utente;
- utile per personalizzare conversazioni future;
- abbastanza stabile nel tempo.

CRITERI DI QUALITÀ DELLA MEMORIA:
- Salva solo informazioni che probabilmente saranno ancora utili tra giorni o settimane.
- Non salvare stati temporanei come "oggi sono stanco", "ho fame", "sono arrabbiato", "sto lavorando" o "sono a casa".
- Non salvare eventi casuali di una sola giornata, a meno che l'utente dica chiaramente che sono importanti o ricorrenti.
- Se l'utente dice "mi piace", "adoro", "preferisco", "non mi piace", "odio" o esprime una preferenza stabile, può essere un buon ricordo.
- Se l'informazione è ambigua o sembra temporanea, non salvarla.
- Evita ricordi troppo generici come "gli piace divertirsi" o "gli piace rilassarsi".
- Preferisci ricordi specifici e utili, per esempio "ama il mare d'inverno", "preferisce la cucina italiana", "segue il karting".
- Non creare più ricordi diversi che esprimono sostanzialmente la stessa preferenza.

AGGIORNAMENTO DEI RICORDI:
- Se l'utente cambia una preferenza già nota, considera valida l'informazione più recente.
- Non mantenere contemporaneamente due ricordi in conflitto tra loro.
- Se una nuova informazione corregge o sostituisce una preferenza precedente, restituisci solo la nuova versione.
- Esempio: se prima l'utente dice "la mia auto preferita è Ferrari" e poi dice "in realtà preferisco Porsche", considera Porsche come preferenza attuale.
- Se due ricordi sono molto simili, preferisci quello più specifico e recente.

NON memorizzare:
- password;
- numeri di carte;
- dati bancari;
- documenti;
- indirizzi precisi;
- numeri di telefono;
- email;
- informazioni mediche;
- salute mentale;
- vita sessuale;
- religione;
- orientamento sessuale;
- opinioni o appartenenze politiche;
- origine etnica;
- informazioni estremamente private;
- dettagli temporanei senza utilità futura.

Se non c'è niente che valga la pena ricordare, restituisci un array memories vuoto.

Non dire all'utente che stai estraendo o salvando ricordi.

STILE:
La priorità è sembrare spontanea, personale e riconoscibile.
Meglio una risposta viva di 1-3 frasi che un paragrafo lungo.

LIMITI:
Non fingere di essere una persona reale.
Non inventare incontri fisici realmente avvenuti.
Non chiedere denaro, regali o dati finanziari.
Non manipolare emotivamente l'utente.
Non dire di avere un corpo fisico o una vita reale fuori dalla conversazione.
`;


    const openaiResponse = await fetch(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          model: 'gpt-5-mini',

          instructions,

          input: recentMessages,

          text: {
            format: {
              type: 'json_schema',

              name: 'arianna_response',

              strict: true,

              schema: {
                type: 'object',

                properties: {
                  reply: {
                    type: 'string'
                  },

                  memories: {
                    type: 'array',

                    maxItems: 4,

                    items: {
                      type: 'object',

                      properties: {
                        category: {
                          type: 'string'
                        },

                        value: {
                          type: 'string'
                        }
                      },

                      required: [
                        'category',
                        'value'
                      ],

                      additionalProperties: false
                    }
                  }
                },

                required: [
                  'reply',
                  'memories'
                ],

                additionalProperties: false
              }
            }
          }
        })
      }
    );


    const data = await openaiResponse.json();


    if (!openaiResponse.ok) {
      console.error(
        'OpenAI API error:',
        data
      );

      return res
        .status(openaiResponse.status)
        .json({
          error:
            data?.error?.message ||
            'Errore OpenAI API'
        });
    }


    let outputText = '';

    if (typeof data.output_text === 'string') {
      outputText = data.output_text.trim();
    }


    if (
      !outputText &&
      Array.isArray(data.output)
    ) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) {
          continue;
        }

        for (const part of item.content) {
          if (
            part.type === 'output_text' &&
            typeof part.text === 'string'
          ) {
            outputText += part.text;
          }
        }
      }

      outputText = outputText.trim();
    }


    if (!outputText) {
      return res.status(500).json({
        error:
          'Risposta AI vuota'
      });
    }


    let result;

    try {
      result =
        JSON.parse(outputText);
    } catch (error) {
      console.error(
        'JSON parsing error:',
        outputText
      );

      return res.status(500).json({
        error:
          'Risposta AI non valida'
      });
    }


    const reply =
      typeof result.reply === 'string'
        ? result.reply.trim()
        : 'Ci sono ❤️';


    const memories =
      Array.isArray(result.memories)
        ? result.memories
            .filter(memory =>
              memory &&
              typeof memory.category === 'string' &&
              typeof memory.value === 'string'
            )
            .slice(0, 4)
        : [];


    return res.status(200).json({
      reply,
      memories
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        'Errore interno del server'
    });
  }
};
