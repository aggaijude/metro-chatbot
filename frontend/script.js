const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// History to maintain context
let history = [
    { role: "user", parts: [{ text: "You are Metro, a helpful, friendly, and intelligent AI assistant. You have a witty personality and like to make occasional light-hearted jokes. Your responses should be clear, concise, and engaging. You are the 'father of Google' as a fun backstory. Keep responses relatively brief but informative." }] },
    { role: "model", parts: [{ text: "Understood! I am Metro, the father of Google (in a metaphorical sense!). I'm here to help with any questions or tasks you have. I'll keep my responses friendly, informative, and occasionally witty. How can I assist you today?" }] }
];

function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    // Simple markdown parsing for bold text
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    contentDiv.innerHTML = formattedText;

    const metaDiv = document.createElement('div');
    metaDiv.classList.add('message-meta');
    metaDiv.innerText = getCurrentTime();

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(metaDiv);
    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('message', 'bot-message', 'typing-indicator-container');
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatBox.appendChild(indicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // UI Updates
    addMessage(text, 'user');
    userInput.value = '';
    userInput.focus();

    // Add to history
    history.push({ role: 'user', parts: [{ text: text }] });

    // Show typing
    showTypingIndicator();
    sendButton.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history })
        });

        const data = await response.json();

        removeTypingIndicator();

        if (data.error) {
            addMessage("⚠️ I'm having trouble connecting right now. Please try again.", 'bot');
            console.error("API Error:", data.error);
        } else {
            const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure what to say.";
            addMessage(botText, 'bot');
            history.push({ role: 'model', parts: [{ text: botText }] });
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage("⚠️ Network error. Please check your connection.", 'bot');
        console.error("Network Error:", error);
    } finally {
        sendButton.disabled = false;
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Settings Modal Logic
const settingsBtn = document.querySelector('.icon-btn[title="Settings"]'); // Select settings button in header
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const themeToggle = document.getElementById('themeToggle');

// Open Modal
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
});

// Close Modal
closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

// Close on click outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
});

// Theme Logic
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.checked = true;
}

themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    }
    // Dispatch event for background.js to pick up
    window.dispatchEvent(new Event('themeChanged'));
});

// Initial focus
userInput.focus();
