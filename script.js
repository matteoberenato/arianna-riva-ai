const home = document.getElementById('home');
const chat = document.getElementById('chat');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');

const conversation = [];

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
  conversation.push({ role: 'user', content: text });
  const thinking = addMessage('Arianna sta scrivendo…', 'arianna');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversation })
    });

    const data = await response.json();
    thinking.remove();

    if (!response.ok) {
      throw new Error(data.error || 'Errore nella risposta del server');
    }

    const reply = data.reply || 'Non sono riuscita a rispondere in questo momento.';
    addMessage(reply, 'arianna');
    conversation.push({ role: 'assistant', content: reply });

  } catch (error) {
    thinking.remove();
    console.error(error);
    addMessage('Ops… in questo momento non riesco a collegarmi. Riprova tra poco ❤️', 'arianna');
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
