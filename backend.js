// index.js

// Required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Utility functions for authentication
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Authentication routes
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (user && await comparePassword(password, user.password)) {
            const token = generateToken(user.id);
            res.json({ token, userId: user.id });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Login failed' });
    }
});

app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );
        res.status(201).json({ userId: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Data management routes
app.post('/data/store', async (req, res) => {
    const { userId, website, username, password, notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO data (user_id, website, username, password, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [userId, website, username, password, notes]
        );
        res.status(201).json({ message: 'Data saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save data' });
    }
});

app.get('/data', async (req, res) => {
    const { userId } = req.query;
    try {
        const result = await pool.query('SELECT * FROM data WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load data' });
    }
});

app.delete('/data/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM data WHERE id = $1', [id]);
        res.json({ message: 'Data deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete data' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
