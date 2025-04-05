document.addEventListener('DOMContentLoaded', function () {
    // DOM elements
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const goalInput = document.getElementById('goalInput');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const goalTags = document.getElementById('goalTags');
    const interestInput = document.getElementById('interestInput');
    const addInterestBtn = document.getElementById('addInterestBtn');
    const interestTags = document.getElementById('interestTags');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const requestChallengeBtn = document.getElementById('requestChallengeBtn');
    const activeChallenge = document.getElementById('activeChallenge');
    const challengeTitle = document.getElementById('challengeTitle');
    const challengeDescription = document.getElementById('challengeDescription');
    const challengeTime = document.getElementById('challengeTime');
    const completeChallengeBtn = document.getElementById('completeChallenge');
    const clearChallengeBtn = document.getElementById('clearChallenge');

    // State
    let goals = [];
    let interests = [];
    let currentTheme = 'blue';
    let isBotTyping = false;

    // Initialize
    loadFromLocalStorage();
    applyTheme(currentTheme);
    checkForActiveChallenge();

    // Event Listeners
    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        sendMessage();
    });
    settingsBtn.addEventListener('click', toggleSettings);
    addGoalBtn.addEventListener('click', addGoal);
    addInterestBtn.addEventListener('click', addInterest);
    goalInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addGoal();
        }
    });
    interestInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addInterest();
        }
    });
    themeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const theme = this.getAttribute('data-theme');
            applyTheme(theme);
            saveToLocalStorage();
        });
    });
    requestChallengeBtn.addEventListener('click', requestChallenge);
    completeChallengeBtn.addEventListener('click', markChallengeComplete);
    clearChallengeBtn.addEventListener('click', clearChallenge);

    // Main sendMessage function
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;

        addMessage('user', message);
        messageInput.value = '';

        showTypingIndicator();

        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, goals, interests }),
        })
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                addMessage('bot', data.response);
                if (data.challenge) {
                    displayChallenge(data.challenge);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                removeTypingIndicator();
                addMessage('bot', 'Sorry, I encountered an error. Please try again later.');
            });
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex mb-4 message-animation ${sender === 'user' ? 'justify-end' : ''}`;

        let avatarHTML = '';
        let messageClass = '';

        if (sender === 'user') {
            avatarHTML = `<div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 ml-3 flex-shrink-0"><i class="fas fa-user"></i></div>`;
            messageClass = 'bg-blue-100 rounded-lg rounded-tr-none';
        } else {
            avatarHTML = `<div class="w-10 h-10 rounded-full theme-button flex items-center justify-center text-white flex-shrink-0"><i class="fas fa-robot"></i></div>`;
            messageClass = 'bg-gray-100 rounded-lg rounded-tl-none';
        }

        messageDiv.innerHTML = sender === 'user'
            ? `<div class="mr-3 p-3 ${messageClass} max-w-xs md:max-w-md lg:max-w-lg"><p>${formatMessageText(text)}</p></div>${avatarHTML}`
            : `${avatarHTML}<div class="ml-3 p-3 ${messageClass} max-w-xs md:max-w-md lg:max-w-lg"><p>${formatMessageText(text)}</p></div>`;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatMessageText(text) {
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/^\s*-\s+(.+)/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc pl-5 my-2">$1</ul>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    function showTypingIndicator() {
        if (!isBotTyping) {
            isBotTyping = true;
            const typingDiv = document.createElement('div');
            typingDiv.className = 'flex mb-4 typing-container';
            typingDiv.innerHTML = `
                <div class="w-10 h-10 rounded-full theme-button flex items-center justify-center text-white flex-shrink-0">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ml-3 p-3 bg-gray-100 rounded-lg rounded-tl-none">
                    <div class="typing-indicator"><span></span><span></span><span></span></div>
                </div>`;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    function removeTypingIndicator() {
        const typingContainer = document.querySelector('.typing-container');
        if (typingContainer) typingContainer.remove();
        isBotTyping = false;
    }

    function toggleSettings() {
        settingsPanel.classList.toggle('hidden');
    }

    function addGoal() {
        const goal = goalInput.value.trim();
        if (goal && !goals.includes(goal)) {
            goals.push(goal);
            renderTags();
            goalInput.value = '';
            saveToLocalStorage();
        }
    }

    function addInterest() {
        const interest = interestInput.value.trim();
        if (interest && !interests.includes(interest)) {
            interests.push(interest);
            renderTags();
            interestInput.value = '';
            saveToLocalStorage();
        }
    }

    function removeGoal(goal) {
        goals = goals.filter(g => g !== goal);
        renderTags();
        saveToLocalStorage();
    }

    function removeInterest(interest) {
        interests = interests.filter(i => i !== interest);
        renderTags();
        saveToLocalStorage();
    }

    function renderTags() {
        goalTags.innerHTML = '';
        goals.forEach(goal => {
            const tagEl = document.createElement('div');
            tagEl.className = 'tag theme-border';
            tagEl.innerHTML = `<span>${goal}</span><span class="tag-close" data-goal="${goal}">×</span>`;
            goalTags.appendChild(tagEl);
        });

        document.querySelectorAll('.tag-close[data-goal]').forEach(btn => {
            btn.addEventListener('click', function () {
                removeGoal(this.getAttribute('data-goal'));
            });
        });

        interestTags.innerHTML = '';
        interests.forEach(interest => {
            const tagEl = document.createElement('div');
            tagEl.className = 'tag theme-border';
            tagEl.innerHTML = `<span>${interest}</span><span class="tag-close" data-interest="${interest}">×</span>`;
            interestTags.appendChild(tagEl);
        });

        document.querySelectorAll('.tag-close[data-interest]').forEach(btn => {
            btn.addEventListener('click', function () {
                removeInterest(this.getAttribute('data-interest'));
            });
        });
    }

    function applyTheme(theme) {
        document.body.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-red', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
        document.querySelector('header').className = `theme-primary text-white shadow-lg`;
        currentTheme = theme;
    }

    function saveToLocalStorage() {
        const data = { goals, interests, theme: currentTheme };
        localStorage.setItem('chatbotSettings', JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('chatbotSettings') || '{}');
        goals = data.goals || [];
        interests = data.interests || [];
        currentTheme = data.theme || 'blue';
        renderTags();
    }

    function requestChallenge() {
        addMessage('user', "Can you suggest a challenge for me?");
        showTypingIndicator();

        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Generate a personalized challenge for me",
                goals: goals,
                interests: interests
            }),
        })
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                addMessage('bot', data.response);
                if (data.challenge) displayChallenge(data.challenge);
            })
            .catch(error => {
                console.error('Error:', error);
                removeTypingIndicator();
                addMessage('bot', 'Sorry, I encountered an error generating a challenge.');
            });
    }

    function displayChallenge(challenge) {
        challengeTitle.textContent = challenge.title;
        challengeDescription.textContent = challenge.description;
        challengeTime.textContent = challenge.timeRequired;
        activeChallenge.style.display = 'block';

        localStorage.setItem('activeChallenge', JSON.stringify(challenge));
    }

    function checkForActiveChallenge() {
        const stored = localStorage.getItem('activeChallenge');
        if (stored) {
            const challenge = JSON.parse(stored);
            displayChallenge(challenge);
        }
    }

    function markChallengeComplete() {
        addMessage('user', "I completed the challenge!");
        localStorage.removeItem('activeChallenge');
        activeChallenge.style.display = 'none';
    }

    function clearChallenge() {
        localStorage.removeItem('activeChallenge');
        activeChallenge.style.display = 'none';
    }
});
