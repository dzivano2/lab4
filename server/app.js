const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/api/superheroes', (req, res) => {
    // Handle the request for superhero data
});

module.exports = app;
