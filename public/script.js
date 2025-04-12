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
    const themeToggle = document.getElementById('themeToggle');
    const requestChallengeBtn = document.getElementById('requestChallengeBtn');
    const activeChallenge = document.getElementById('activeChallenge');
    const challengeTitle = document.getElementById('challengeTitle');
    const challengeDescription = document.getElementById('challengeDescription');
    const challengeTime = document.getElementById('challengeTime');
    const challengeTimer = document.getElementById('challengeTimer');
    const completeChallengeBtn = document.getElementById('completeChallenge');
    const clearChallengeBtn = document.getElementById('clearChallenge');
    const streak = document.getElementById('streak');
    

    


    // State
    let goals = [];
    let interests = [];
    let currentTheme = 'purple';
    let isDarkMode = false;
    let isBotTyping = false;
    let challengeStartTime = null;
    let timerInterval = null;

    // Initialize
    loadFromLocalStorage();
    applyTheme(currentTheme);
    checkForActiveChallenge();
    addWelcomeMessage();

    // Event Listeners
    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        sendMessage();
    });

    settingsBtn.addEventListener('click', function() {
        document.querySelector('.side-panel').classList.toggle('active');
    });

    themeToggle.addEventListener('click', toggleDarkMode);

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
            themeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyTheme(theme);
            saveToLocalStorage();
        });
    });

    requestChallengeBtn.addEventListener('click', requestChallenge);
    completeChallengeBtn.addEventListener('click', markChallengeComplete);
    clearChallengeBtn.addEventListener('click', clearChallenge);

    // Add welcome message
    function addWelcomeMessage() {
        // Welcome message is now in HTML
        setTimeout(() => {
            if (chatMessages.querySelectorAll('.message').length === 0) {
                addMessage('bot', 'Hi there! I\'m your AI Challenge Bot. I can help you with daily challenges and self-improvement. Try asking me for advice or request a challenge!');
            }
        }, 1000);
    }

    // Main sendMessage function
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;

        addMessage('user', message);
        messageInput.value = '';
        messageInput.focus();

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
        messageDiv.className = `message ${sender}`;

        const avatarIcon = sender === 'user' ? 'fa-user' : 'fa-robot';
        
        messageDiv.innerHTML = `
            ${sender === 'bot' ? `<div class="message-avatar"><i class="fas ${avatarIcon}"></i></div>` : ''}
            <div class="message-content">${formatMessageText(text)}</div>
            ${sender === 'user' ? `<div class="message-avatar"><i class="fas ${avatarIcon}"></i></div>` : ''}
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatMessageText(text) {
        // Convert URLs to links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-link">$1</a>');
        
        // Convert markdown-style formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert bullet points
        text = text.replace(/^\s*-\s+(.+)/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/gs, '<ul class="message-list">$1</ul>');
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    function showTypingIndicator() {
        if (!isBotTyping) {
            isBotTyping = true;
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot typing-container';
            typingDiv.innerHTML = `
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content typing-indicator"><span></span><span></span><span></span></div>
            `;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    function removeTypingIndicator() {
        const typingContainer = document.querySelector('.typing-container');
        if (typingContainer) {
            typingContainer.classList.add('fade-out');
            setTimeout(() => {
                typingContainer.remove();
                isBotTyping = false;
            }, 300);
        }
    }

    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            document.body.classList.add('theme-dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('theme-dark');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        saveToLocalStorage();
    }

    function addGoal() {
        const goal = goalInput.value.trim();
        if (goal && !goals.includes(goal)) {
            goals.push(goal);
            renderTags();
            goalInput.value = '';
            goalInput.focus();
            saveToLocalStorage();
            
            // Provide feedback
            addMessage('bot', `I've added "${goal}" to your goals. This will help me provide more personalized challenges and advice.`);
        }
    }

    function addInterest() {
        const interest = interestInput.value.trim();
        if (interest && !interests.includes(interest)) {
            interests.push(interest);
            renderTags();
            interestInput.value = '';
            interestInput.focus();
            saveToLocalStorage();
            
            // Provide feedback
            addMessage('bot', `Great! I've added "${interest}" to your interests. I'll keep this in mind when suggesting challenges.`);
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
            tagEl.className = 'tag';
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
            tagEl.className = 'tag';
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
        document.body.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-red');
        document.body.classList.add(`theme-${theme}`);
        currentTheme = theme;
        
        // Update active theme button
        themeButtons.forEach(btn => {
            if (btn.getAttribute('data-theme') === theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function saveToLocalStorage() {
        const data = { 
            goals, 
            interests, 
            theme: currentTheme,
            isDarkMode
        };
        localStorage.setItem('chatbotSettings', JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('chatbotSettings') || '{}');
        goals = data.goals || [];
        interests = data.interests || [];
        currentTheme = data.theme || 'purple';
        isDarkMode = data.isDarkMode || false;
        
        if (isDarkMode) {
            document.body.classList.add('theme-dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
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

        // Start the timer
        challengeStartTime = new Date();
        updateChallengeTimer();
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateChallengeTimer, 1000);

        localStorage.setItem('activeChallenge', JSON.stringify({
            ...challenge,
            startTime: challengeStartTime.getTime()
        }));
        
        // Add animation
        activeChallenge.classList.add('pulse-animation');
        setTimeout(() => {
            activeChallenge.classList.remove('pulse-animation');
        }, 1000);
    }

    function updateChallengeTimer() {
        if (!challengeStartTime) return;
        
        const now = new Date();
        const elapsed = now - challengeStartTime;
        
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
        
        challengeTimer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function checkForActiveChallenge() {
        const stored = localStorage.getItem('activeChallenge');
        if (stored) {
            const challenge = JSON.parse(stored);
            challengeTitle.textContent = challenge.title;
            challengeDescription.textContent = challenge.description;
            challengeTime.textContent = challenge.timeRequired;
            activeChallenge.style.display = 'block';
            
            // Restore timer
            if (challenge.startTime) {
                challengeStartTime = new Date(challenge.startTime);
                updateChallengeTimer();
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = setInterval(updateChallengeTimer, 1000);
            }
        }
    }

    function markChallengeComplete() {
        const elapsedTime = challengeTimer.textContent;
        addMessage('user', "I completed the challenge!");
        
        // Add confetti effect
        createConfetti();
        
        setTimeout(() => {
            addMessage('bot', `Congratulations on completing your challenge! It took you ${elapsedTime}. Would you like another challenge?`);
        }, 1000);
        
        localStorage.removeItem('activeChallenge');
        activeChallenge.style.display = 'none';
        clearInterval(timerInterval);
        challengeStartTime = null;
        
        // Check streak completion and apply glow effect
        checkStreakCompletion();
    }

    function clearChallenge() {
        localStorage.removeItem('activeChallenge');
        activeChallenge.style.display = 'none';
        clearInterval(timerInterval);
        challengeStartTime = null;
    }
    
    // Confetti effect for challenge completion
    function createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
        
        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confettiContainer.appendChild(confetti);
        }
        
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }
    
    // Add CSS for confetti
    const confettiStyle = document.createElement('style');
    confettiStyle.textContent = `
        @keyframes confettiFall {
            0% { transform: translateY(-100vh) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
        }
        
        .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        }
        
        .confetti {
            position: absolute;
            top: -10px;
            width: 10px;
            height: 10px;
            opacity: 0.7;
            animation: confettiFall linear forwards;
        }
        
        @keyframes pulse-animation {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .pulse-animation {
            animation: pulse-animation 0.5s ease-in-out;
        }
        
        .fade-out {
            opacity: 0;
            transition: opacity 0.3s ease-out;
        }
        
        .text-link {
            color: var(--primary-color);
            text-decoration: underline;
        }
        
        .message-list {
            margin-left: 1rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }
    `;
    document.head.appendChild(confettiStyle);

    // Function to check streak completion and apply glow effect
    function checkStreakCompletion() {
        const isStreakComplete = true; // Replace with actual logic to check streak completion

        if (isStreakComplete) {
            streak.classList.add('glow');
        } else {
            streak.classList.remove('glow');
        }
    }

    // Call this function where appropriate, e.g., after updating the streak
    checkStreakCompletion();
});