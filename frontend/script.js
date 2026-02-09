document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const themeToggle = document.getElementById('themeToggle');
    const clearChatBtn = document.getElementById('clearChat');
    const motionToggle = document.getElementById('motionToggle');
    const fontButtons = document.querySelectorAll('.size-btn');

    // History to maintain context
    let history = [
        { role: "user", parts: [{ text: "You are Metro, a helpful, friendly, and intelligent AI assistant. You have a witty personality and like to make occasional light-hearted jokes. Your responses should be clear, concise, and engaging. You are the 'father of Google' as a fun backstory. Keep responses relatively brief but informative." }] },
        { role: "model", parts: [{ text: "Understood! I am Metro, the father of Google (in a metaphorical sense!). I'm here to help with any questions or tasks you have. I'll keep my responses friendly, informative, and occasionally witty. How can I assist you today?" }] }
    ];

    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function scrollToBottom() {
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addMessage(text, sender) {
        if (!chatBox) return;

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
        if (!chatBox) return;
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
        if (!userInput || !sendButton) return;

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
            if (sendButton) sendButton.disabled = false;
        }
    }

    // Event Listeners
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (userInput) {
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        // Initial focus
        userInput.focus();
    }

    // Settings Modal Logic
    if (settingsBtn && settingsModal && closeSettings) {
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
    }

    // Theme Logic
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            // Already handled by head/body script for class, just sync toggle
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('light-theme');
                document.documentElement.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-theme');
                document.documentElement.classList.remove('light-theme');
                localStorage.setItem('theme', 'dark');
            }
            // Dispatch event for background.js to pick up
            window.dispatchEvent(new Event('themeChanged'));
        });
    }

    // --- Settings: Font Size ---
    const root = document.documentElement;

    // Function to set font size
    function setFontSize(size) {
        // Reset active buttons
        if (fontButtons) {
            fontButtons.forEach(btn => btn.classList.remove('active'));
            // Set active button
            const activeBtn = document.querySelector(`.size-btn[data-size="${size}"]`);
            if (activeBtn) activeBtn.classList.add('active');
        }

        // Update variable
        let pixelSize = '1rem';
        if (size === 'small') pixelSize = '0.875rem';
        if (size === 'large') pixelSize = '1.125rem';

        root.style.setProperty('--font-size-base', pixelSize);
        localStorage.setItem('fontSize', size);
    }

    // Load saved font size
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    setFontSize(savedFontSize);

    // Event listeners
    if (fontButtons) {
        fontButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                setFontSize(btn.dataset.size);
            });
        });
    }

    // --- Settings: Reduce Motion ---
    if (motionToggle) {
        // Function to handle motion
        function setMotion(reduce) {
            motionToggle.checked = reduce;
            if (window.toggleAnimation) {
                window.toggleAnimation(!reduce);
            }
            localStorage.setItem('reduceMotion', reduce);
        }

        // Load saved motion setting
        // Check if window.toggleAnimation is available immediately, if not wait a bit
        // background.js might load after script.js
        setTimeout(() => {
            const savedMotion = localStorage.getItem('reduceMotion') === 'true';
            setMotion(savedMotion);
        }, 100);

        motionToggle.addEventListener('change', () => {
            setMotion(motionToggle.checked);
        });
    }

    // --- Settings: Clear Chat ---
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the conversation history?')) {
                // Clear UI
                if (chatBox) chatBox.innerHTML = '';

                // Reset History
                history = [
                    { role: "user", parts: [{ text: "You are Metro, a helpful, friendly, and intelligent AI assistant. You have a witty personality and like to make occasional light-hearted jokes. Your responses should be clear, concise, and engaging. You are the 'father of Google' as a fun backstory. Keep responses relatively brief but informative." }] },
                    { role: "model", parts: [{ text: "Understood! I am Metro, the father of Google (in a metaphorical sense!). I'm here to help with any questions or tasks you have. I'll keep my responses friendly, informative, and occasionally witty. How can I assist you today?" }] }
                ];

                // Re-add welcome message
                const welcomeHTML = `
                    <div class="welcome-message">
                        <div class="welcome-logo-container">
                            <img src="logo.png" alt="Metro AI" class="welcome-logo">
                        </div>
                        <div class="welcome-content">
                            <h2>Hello, I'm Metro.</h2>
                            <p>Your advanced AI companion. Ready to assist with creativity, analysis, and conversation.</p>
                        </div>
                    </div>
                `;
                if (chatBox) chatBox.insertAdjacentHTML('beforeend', welcomeHTML);

                // Close modal
                if (settingsModal) settingsModal.classList.remove('active');
            }
        });
    }

    // Mobile Viewport Fix
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.content = "width=device-width, initial-scale=1.0, interactive-widget=resizes-content, maximum-scale=1.0, user-scalable=no";
    }
});


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
    // Already handled by head script for body class, just sync toggle
    themeToggle.checked = true;
}

themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.body.classList.add('light-theme');
        document.documentElement.classList.add('light-theme'); // for broader scope support
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        document.documentElement.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    }
    // Dispatch event for background.js to pick up
    window.dispatchEvent(new Event('themeChanged'));
});

// --- Settings: Font Size ---
const fontButtons = document.querySelectorAll('.size-btn');
const root = document.documentElement;

// Function to set font size
function setFontSize(size) {
    // Reset active buttons
    fontButtons.forEach(btn => btn.classList.remove('active'));

    // Set active button
    const activeBtn = document.querySelector(`.size-btn[data-size="${size}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update variable
    let pixelSize = '1rem';
    if (size === 'small') pixelSize = '0.875rem';
    if (size === 'large') pixelSize = '1.125rem';

    root.style.setProperty('--font-size-base', pixelSize);
    localStorage.setItem('fontSize', size);
}

// Load saved font size
const savedFontSize = localStorage.getItem('fontSize') || 'medium';
setFontSize(savedFontSize);

// Event listeners
fontButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setFontSize(btn.dataset.size);
    });
});

// --- Settings: Reduce Motion ---
const motionToggle = document.getElementById('motionToggle');

// Function to handle motion
function setMotion(reduce) {
    motionToggle.checked = reduce;
    if (window.toggleAnimation) {
        window.toggleAnimation(!reduce);
    }
    localStorage.setItem('reduceMotion', reduce);
}

// Load saved motion setting
const savedMotion = localStorage.getItem('reduceMotion') === 'true';
setMotion(savedMotion);

motionToggle.addEventListener('change', () => {
    setMotion(motionToggle.checked);
});

// --- Settings: Clear Chat ---
const clearChatBtn = document.getElementById('clearChat');

clearChatBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
        // Clear UI
        chatBox.innerHTML = '';

        // Reset History
        history = [
            { role: "user", parts: [{ text: "You are Metro, a helpful, friendly, and intelligent AI assistant. You have a witty personality and like to make occasional light-hearted jokes. Your responses should be clear, concise, and engaging. You are the 'father of Google' as a fun backstory. Keep responses relatively brief but informative." }] },
            { role: "model", parts: [{ text: "Understood! I am Metro, the father of Google (in a metaphorical sense!). I'm here to help with any questions or tasks you have. I'll keep my responses friendly, informative, and occasionally witty. How can I assist you today?" }] }
        ];

        // Re-add welcome message (optional, but good for UX)
        const welcomeHTML = `
            <div class="welcome-message">
                <div class="welcome-logo-container">
                    <img src="logo.png" alt="Metro AI" class="welcome-logo">
                </div>
                <div class="welcome-content">
                    <h2>Hello, I'm Metro.</h2>
                    <p>Your advanced AI companion. Ready to assist with creativity, analysis, and conversation.</p>
                </div>
            </div>
        `;
        chatBox.insertAdjacentHTML('beforeend', welcomeHTML);

        // Close modal
        settingsModal.classList.remove('active');
    }
});

// Mobile Viewport Fix for visual keyboard
const viewportMeta = document.querySelector('meta[name="viewport"]');
if (viewportMeta) {
    viewportMeta.content = "width=device-width, initial-scale=1.0, interactive-widget=resizes-content, maximum-scale=1.0, user-scalable=no";
}

// Initial focus
userInput.focus();
