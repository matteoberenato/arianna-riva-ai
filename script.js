const home = document.getElementById('home');
const chat = document.getElementById('chat');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');

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
}

function demoReply(text) {
  const t = text.toLowerCase();
  if (/(ciao|salve|buongiorno|buonasera)/.test(t))
    return "Ciao 😊 Sono felice che tu sia qui. Raccontami qualcosa di te.";
  if (/(come stai|come va)/.test(t))
    return "Sto benissimo, grazie ❤️ E tu come stai?";
  if (/(nome|chi sei)/.test(t))
    return "Sono Arianna Riva, un personaggio virtuale creato con intelligenza artificiale. Piacere di conoscerti 😊";
  return "Interessante 😊 Raccontami qualcosa in più. Questa è ancora la mia modalità demo: presto potrò conversare con una vera IA.";
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  input.value = '';
  setTimeout(() => addMessage(demoReply(text), 'arianna'), 550);
});
