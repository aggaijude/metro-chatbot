require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Use axios for better stability

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Resolve frontend path
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

console.log('Serving static files from:', frontendPath);

// Rate Limiting (Basic in-memory)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute

const checkRateLimit = (ip) => {
    const now = Date.now();
    const userLimit = rateLimit.get(ip) || { count: 0, startTime: now };

    if (now - userLimit.startTime > RATE_LIMIT_WINDOW) {
        userLimit.count = 1;
        userLimit.startTime = now;
    } else {
        userLimit.count++;
    }

    rateLimit.set(ip, userLimit);
    return userLimit.count <= MAX_REQUESTS;
};

// API Endpoint
app.post('/api/chat', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: { message: 'Too many requests. Please try again later.' } });
    }

    try {
        const { history } = req.body;

        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ error: { message: 'Invalid request format.' } });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('API key is missing in .env');
            return res.status(500).json({ error: { message: 'Server configuration error.' } });
        }

        const MODEL_NAME = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

        // Forward request using Axios
        const response = await axios.post(url, { contents: history });

        res.json(response.data);

    } catch (error) {
        console.error('Gemini API Error:', error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const details = error.response ? error.response.data : error.message;
        res.status(status).json({ error: { message: 'AI Provider Error', details } });
    }
});

// Serve Frontend for all other routes
// app.get('*', (req, res) => {
//     const indexPath = path.join(frontendPath, 'index.html');
//     res.sendFile(indexPath, (err) => {
//         if (err) {
//             console.error('Error sending file:', err);
//             res.status(500).send('Error loading application.');
//         }
//     });
// });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
