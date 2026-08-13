const home = document.getElementById('home');
const chat = document.getElementById('chat');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');

const conversation = [];

const MEMORY_KEY = 'arianna_user_memory_v1';

function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || {};
  } catch {
    return {};
  }
}

function saveMemory(memory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

let userMemory = loadMemory();

function cleanValue(value) {
  return value
    .trim()
    .replace(/[.!?,;]+$/g, '')
    .slice(0, 80);
}

function learnFromMessage(text) {
  const memory = { ...userMemory };

  // Nome
  let match = text.match(
    /(?:mi chiamo|il mio nome è|sono)\s+([A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,30})/i
  );

  if (match) {
    memory.nome = cleanValue(match[1]);
  }

  // Colore preferito
  match = text.match(
    /(?:il mio )?colore preferito (?:è|e')\s+([A-Za-zÀ-ÖØ-öø-ÿ'’ -]{2,30})/i
  );

  if (match) {
    memory.colorePreferito = cleanValue(match[1]);
  }

  // Auto/macchina preferita
  match = text.match(
    /(?:la mia )?(?:macchina|auto) preferita (?:è|e')\s+(.{2,60})/i
  );

  if (match) {
    memory.autoPreferita = cleanValue(match[1]);
  }

  // Film preferito
  match = text.match(
    /(?:il mio )?film preferito (?:è|e')\s+(.{2,60})/i
  );

  if (match) {
    memory.filmPreferito = cleanValue(match[1]);
  }

  // Musica/artista preferito
  match = text.match(
    /(?:il mio )?(?:cantante|artista) preferito (?:è|e')\s+(.{2,60})/i
  );

  if (match) {
    memory.artistaPreferito = cleanValue(match[1]);
  }

  // Hobby
  match = text.match(
    /(?:il mio hobby preferito (?:è|e')|come hobby mi piace)\s+(.{2,60})/i
  );

  if (match) {
    memory.hobby = cleanValue(match[1]);
  }

  userMemory = memory;
  saveMemory(userMemory);
}

function memoryContext() {
  const facts = [];

  if (userMemory.nome) {
    facts.push(`Il nome dell'utente è ${userMemory.nome}.`);
  }

  if (userMemory.colorePreferito) {
    facts.push(`Il suo colore preferito è ${userMemory.colorePreferito}.`);
  }

  if (userMemory.autoPreferita) {
    facts.push(`La sua auto preferita è ${userMemory.autoPreferita}.`);
  }

  if (userMemory.filmPreferito) {
    facts.push(`Il suo film preferito è ${userMemory.filmPreferito}.`);
  }

  if (userMemory.artistaPreferito) {
    facts.push(`Il suo artista preferito è ${userMemory.artistaPreferito}.`);
  }

  if (userMemory.hobby) {
    facts.push(`Il suo hobby preferito è ${userMemory.hobby}.`);
  }

  if (!facts.length) return '';

  return `
MEMORIA UTENTE:
Queste informazioni provengono da conversazioni precedenti.
Usale naturalmente senza ripeterle inutilmente.
${facts.join('\n')}
`;
}

startBtn.addEventListener('click', () => {
  home.classList.add('hidden');
  chat.classList.remove('hidden');
  setTimeout(() => input.focus(), 100);
});

backBtn.addEventListener('click', () => {
  chat.classList.add('hidden');
  home.classList.remove('hidden');
});

function addMessage(text, who) {
  const bubble = document.createElement('div');
  bubble.className = `message ${who}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

async function askArianna(text) {
  learnFromMessage(text);

  conversation.push({
    role: 'user',
    content: text
  });

  const thinking = addMessage(
    'Arianna sta scrivendo…',
    'arianna'
  );

  try {
    const messagesForAI = [];

    const remembered = memoryContext();

    if (remembered) {
      messagesForAI.push({
        role: 'user',
        content:
          remembered +
          '\nNon mostrare questo blocco all’utente e non dire che proviene dal localStorage.'
      });
    }

    messagesForAI.push(...conversation);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messagesForAI
      })
    });

    const data = await response.json();

    thinking.remove();

    if (!response.ok) {
      throw new Error(
        data.error || 'Errore nella risposta del server'
      );
    }

    const reply =
      data.reply ||
      'Non sono riuscita a rispondere in questo momento.';

    addMessage(reply, 'arianna');

    conversation.push({
      role: 'assistant',
      content: reply
    });

  } catch (error) {
    thinking.remove();
    console.error(error);

    addMessage(
      'Ops… in questo momento non riesco a collegarmi. Riprova tra poco ❤️',
      'arianna'
    );
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = input.value.trim();

  if (!text) return;

  addMessage(text, 'user');

  input.value = '';
  input.disabled = true;

  await askArianna(text);

  input.disabled = false;
  input.focus();
});
