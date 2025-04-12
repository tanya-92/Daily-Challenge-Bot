const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const { createCanvas } = require('canvas');

// Load environment variables
dotenv.config();

// Log environment variables to verify they’re loaded correctly
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY);
console.log('GROQ_API_URL:', process.env.GROQ_API_URL);


// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5000', 'https://daily-challenge-bot.onrender.com']
}));



app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const canvas = createCanvas(parseInt(width), parseInt(height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ccc';
  ctx.fillRect(0, 0, width, height);
  res.set('Content-Type', 'image/png');
  res.send(canvas.toBuffer());
});

// Simple API to handle chatbot requests
app.post('/api/chat', async (req, res) => {
  try {
    const { message, goals = [], interests = [] } = req.body;

    // Use Groq API for chat response
    const groqClient = axios.create({
      baseURL: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Prepare context based on received goals and interests
    let contextPrefix = '';
    if (goals.length > 0 || interests.length > 0) {
      contextPrefix = `The user has the following goals: ${goals.join(', ')}. 
      And interests: ${interests.join(', ')}. 
      Based on this information, `;
    }

    const prompt = `${contextPrefix}${message}`;

    const response = await groqClient.post('/chat/completions', {
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are AI Challenge Bot, an AI assistant designed to help users with daily challenges and self-improvement. Be supportive, motivational, and provide practical advice." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });

    const botResponse = response.data.choices[0].message.content;

    // Generate a simple challenge if specifically requested
    let challenge = null;
    if (message.toLowerCase().includes('challenge') || message.toLowerCase().includes('task')) {
      challenge = generateSimpleChallenge(goals, interests);
    }

    res.json({
      response: botResponse,
      challenge: challenge
    });

  } catch (error) {
    console.error('Chat error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      message: 'Error processing your request',
      error: error.response ? error.response.data : error.message
    });
  }
});

// Simple function to generate challenges without AI
function generateSimpleChallenge(goals = [], interests = []) {
  const defaultChallenges = [
    "Take 10 minutes to write down your top 3 priorities for today",
    "Spend 15 minutes learning something new in an area that interests you",
    "Practice mindfulness meditation for 5 minutes",
    "Take a 15-minute walk outside",
    "Write down three things you're grateful for"
  ];

  if (goals.length > 0 || interests.length > 0) {
    const allItems = [...goals, ...interests];
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    const specificChallenges = [
      `Spend 15 minutes researching something related to "${randomItem}"`,
      `Make a small plan to advance your "${randomItem}" goal this week`,
      `Find one resource (book, article, video) about "${randomItem}" to explore later`,
      `Think about how you might connect "${randomItem}" with another of your interests`,
      `Take 10 minutes to practice or learn something related to "${randomItem}"`
    ];
    return {
      title: `Quick "${randomItem}" Challenge`,
      description: specificChallenges[Math.floor(Math.random() * specificChallenges.length)],
      timeRequired: Math.floor(Math.random() * 15) + 5 + " minutes"
    };
  }

  return {
    title: "Daily Quick Challenge",
    description: defaultChallenges[Math.floor(Math.random() * defaultChallenges.length)],
    timeRequired: Math.floor(Math.random() * 15) + 5 + " minutes"
  };
}

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
