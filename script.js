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
const closeMemoryBtn = document.getElementById('closeMemoryBtn');
const memoryList = document.getElementById('memoryList');
const emptyMemory = document.getElementById('emptyMemory');
const cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
const clearAllMemoryBtn = document.getElementById('clearAllMemoryBtn');

const confirmClearModal = document.getElementById('confirmClearModal');
const cancelClearBtn = document.getElementById('cancelClearBtn');
const confirmClearBtn = document.getElementById('confirmClearBtn');

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
function saveSmartMemories(memories) {
  if (!Array.isArray(memories)) return;

  if (!Array.isArray(userMemory.smartMemories)) {
    userMemory.smartMemories = [];
  }

  for (const memory of memories) {
    if (
      !memory ||
      typeof memory.category !== 'string' ||
      typeof memory.value !== 'string'
    ) {
      continue;
    }

    const category = memory.category.trim().slice(0, 50);
    const value = memory.value.trim().slice(0, 120);

    if (!category || !value) continue;

    const normalizedCategory = category.toLowerCase();

const normalizedValue = value
  .toLowerCase()
  .trim()
  .replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+/i, '');

const existingIndex = userMemory.smartMemories.findIndex(item => {
  const itemCategory = item.category.toLowerCase();
  const itemValue = item.value
  .toLowerCase()
  .trim()
  .replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+/i, '');

  if (itemCategory !== normalizedCategory) return false;

  return (
    itemValue === normalizedValue ||
    itemValue.includes(normalizedValue) ||
    normalizedValue.includes(itemValue)
  );
});

if (existingIndex === -1) {
  userMemory.smartMemories.push({
    category,
    value
  });
} else {
  const existingValue =
    userMemory.smartMemories[existingIndex].value;

  // Manteniamo il valore più corto e pulito
  if (value.length < existingValue.length) {
    userMemory.smartMemories[existingIndex] = {
      category,
      value
    };
  }
}
}   
  
  // Evitiamo che la memoria cresca senza limite.
  userMemory.smartMemories =
    userMemory.smartMemories.slice(-30);

  saveMemory(userMemory);
}

let userMemory = loadMemory();

function renderMemoryList() {
  memoryList.innerHTML = '';

  const items = [];

  if (userMemory.nome) {
    items.push({
      category: 'Nome',
      value: userMemory.nome,
      key: 'nome'
    });
  }

  if (userMemory.colorePreferito) {
    items.push({
      category: 'Colore preferito',
      value: userMemory.colorePreferito,
      key: 'colorePreferito'
    });
  }

  if (userMemory.autoPreferita) {
    items.push({
      category: 'Auto preferita',
      value: userMemory.autoPreferita,
      key: 'autoPreferita'
    });
  }

  if (userMemory.filmPreferito) {
    items.push({
      category: 'Film preferito',
      value: userMemory.filmPreferito,
      key: 'filmPreferito'
    });
  }

  if (userMemory.artistaPreferito) {
    items.push({
      category: 'Artista preferito',
      value: userMemory.artistaPreferito,
      key: 'artistaPreferito'
    });
  }

  if (userMemory.hobby) {
    items.push({
      category: 'Hobby',
      value: userMemory.hobby,
      key: 'hobby'
    });
  }

  if (Array.isArray(userMemory.smartMemories)) {
    userMemory.smartMemories.forEach((memory, index) => {

        const normalizedCategory = memory.category
            .toLowerCase()
            .replace(/\s+/g, '');

        const isDuplicate =
            (normalizedCategory.includes('colore') && userMemory.colorePreferito) ||
            (normalizedCategory.includes('auto') && userMemory.autoPreferita) ||
            (normalizedCategory.includes('hobby') && userMemory.hobby);

        if (!isDuplicate) {
            items.push({
                category: memory.category,
                value: memory.value,
                smartIndex: index
            });
        }
    });
}

  if (!items.length) {
    emptyMemory.classList.remove('hidden');
    return;
  }

  emptyMemory.classList.add('hidden');

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'memory-item';

    const text = document.createElement('div');
    text.className = 'memory-item-text';

    const category = document.createElement('span');
    category.className = 'memory-item-category';
    category.textContent = item.category;

    const value = document.createElement('div');
    value.className = 'memory-item-value';
    value.textContent = item.value;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'memory-delete';
    deleteBtn.type = 'button';
    deleteBtn.textContent = '✕';

    deleteBtn.addEventListener('click', () => {
      if (typeof item.smartIndex === 'number') {
        userMemory.smartMemories.splice(item.smartIndex, 1);
      } else if (item.key) {
        delete userMemory[item.key];
      }

      saveMemory(userMemory);
      renderMemoryList();
    });

    text.appendChild(category);
    text.appendChild(value);

    
    row.appendChild(text);
    row.appendChild(deleteBtn);

    memoryList.appendChild(row);
  });
}

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
    /\bsono\s+(?:(?:un|una)\s+)?(uomo|ragazzo|maschio|donna|ragazza|femmina)\b/i
);

if (match) {
    const genderWord = match[1].toLowerCase();

    if (['uomo', 'ragazzo', 'maschio'].includes(genderWord)) {
        memory.gender = 'maschile';
    } else {
        memory.gender = 'femminile';
    }
}
  
  match = text.match(
  /(?:il mio )?colore preferito (?:è|e')\s+(.{2,30}?)(?=\s+e\s+(?:il mio|la mia)\b|[.!?,;]|$)/i
);

if (match) {
  memory.colorePreferito = cleanValue(match[1]);
}

  match = text.match(
  /(?:la mia )?(?:macchina|auto) preferita (?:è|e')\s+(.{2,60}?)(?=\s+e\s+(?:il mio|la mia)\b|[.!?,;]|$)/i
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
  
if (userMemory.gender) {
    facts.push(`Il genere dell'utente è ${userMemory.gender}.`);
} else {
    facts.push(`Il genere dell'utente non è noto. Usa formulazioni neutre ed evita aggettivi maschili o femminili riferiti all'utente.`);
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
if (Array.isArray(userMemory.smartMemories)) {
  for (const memory of userMemory.smartMemories) {
    facts.push(
      `${memory.category}: ${memory.value}.`
    );
  }
}
  if (!facts.length) return '';

  return `
MEMORIA UTENTE:
Queste informazioni provengono da conversazioni precedenti.
Usale solo quando sono realmente pertinenti alla conversazione.
Non cercare di inserire tutti i ricordi nella stessa risposta.
Preferisci al massimo uno o due ricordi pertinenti per risposta.
Se un ricordo non aggiunge valore alla risposta, ignoralo.
Richiama gusti, hobby e preferenze con naturalezza, come farebbe una persona che conosce già l'utente.
Non dire mai che stai leggendo una memoria, un database o informazioni salvate.
Non ripetere inutilmente informazioni già menzionate nella conversazione.

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
  renderMemoryList();
  memoryModal.classList.remove('hidden');
});

closeMemoryBtn.addEventListener('click', () => {
  memoryModal.classList.add('hidden');
});

cancelMemoryBtn.addEventListener('click', () => {
  memoryModal.classList.add('hidden');
});

clearAllMemoryBtn.addEventListener('click', () => {
  confirmClearModal.classList.remove('hidden');
});

cancelClearBtn.addEventListener('click', () => {
  confirmClearModal.classList.add('hidden');
});

confirmClearBtn.addEventListener('click', () => {
  localStorage.removeItem(MEMORY_KEY);
  localStorage.removeItem('arianna_user_memory_v1');
  localStorage.removeItem('arianna_user_memory_v2');

  userMemory = {};
  conversation.length = 0;

  confirmClearModal.classList.add('hidden');
  memoryModal.classList.add('hidden');

  addMessage(
    'Fatto. Ho cancellato tutti i ricordi salvati su questo browser ❤️',
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

if (response.ok && Array.isArray(data.memories)) {
  saveSmartMemories(data.memories);
}

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
