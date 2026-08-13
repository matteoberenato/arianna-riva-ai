const home = document.getElementById('home');
const chat = document.getElementById('chat');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');

const typingIndicator = document.getElementById('typingIndicator');

const clearMemoryBtn = document.getElementById('clearMemoryBtn');
const memoryModal = document.getElementById('memoryModal');
const cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
const confirmMemoryBtn = document.getElementById('confirmMemoryBtn');

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

  let match = text.match(
    /(?:mi chiamo|il mio nome è|sono)\s+([A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,30})/i
  );

  if (match) {
    memory.nome = cleanValue(match[1]);
  }

  match = text.match(
    /(?:il mio )?colore preferito (?:è|e')\s+([A-Za-zÀ-ÖØ-öø-ÿ'’ -]{2,30})/i
  );

  if (match) {
    memory.colorePreferito = cleanValue(match[1]);
  }

  match = text.match(
    /(?:la mia )?(?:macchina|auto) preferita (?:è|e')\s+(.{2,60})/i
  );

  if (match) {
    memory.autoPreferita = cleanValue(match[1]);
  }

  match = text.match(
    /(?:il mio )?film preferito (?:è|e')\s+(.{2,60})/i
  );

  if (match) {
    memory.filmPreferito = cleanValue(match[1]);
  }

  match = text.match(
    /(?:il mio )?(?:cantante|artista) preferito (?:è|e')\s+(.{2,60})/i
  );

  if (match) {
    memory.artistaPreferito = cleanValue(match[1]);
  }

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

function getCurrentTime() {
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
}

function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

function addMessage(text, who) {
  if (who === 'arianna') {
    const row = document.createElement('div');
    row.className = 'message-row arianna-row';

    const avatar = document.createElement('img');
    avatar.className = 'avatar-small';
    avatar.src = 'arianna.png';
    avatar.alt = 'Arianna';

    const content = document.createElement('div');

    const bubble = document.createElement('div');
    bubble.className = 'message arianna';
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = getCurrentTime();

    content.appendChild(bubble);
    content.appendChild(time);

    row.appendChild(avatar);
    row.appendChild(content);

    messages.appendChild(row);
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'message user';
    bubble.textContent = text;

    messages.appendChild(bubble);
  }

  scrollToBottom();
}

function showTyping() {
  typingIndicator.classList.remove('hidden');
}

function hideTyping() {
  typingIndicator.classList.add('hidden');
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

clearMemoryBtn.addEventListener('click', () => {
  memoryModal.classList.remove('hidden');
});

cancelMemoryBtn.addEventListener('click', () => {
  memoryModal.classList.add('hidden');
});

confirmMemoryBtn.addEventListener('click', () => {
  localStorage.removeItem(MEMORY_KEY);
  userMemory = {};

  memoryModal.classList.add('hidden');

  addMessage(
    'Fatto. Ho cancellato i ricordi salvati su questo browser ❤️',
    'arianna'
  );
});

async function askArianna(text) {
  learnFromMessage(text);

  conversation.push({
    role: 'user',
    content: text
  });

  showTyping();

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

    hideTyping();

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
    hideTyping();
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
