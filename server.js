// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // serves your HTML and frontend JS from 'public' folder

app.post('/api/chat', (req, res) => {
  const { message, goals, interests } = req.body;
  res.json({
    response: `Here's a personalized challenge based on your message: ${message}`,
    challenge: {
      title: "Build a To-Do List App",
      description: "Create a basic to-do list with add/remove functionality.",
      timeRequired: "30 minutes"
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
