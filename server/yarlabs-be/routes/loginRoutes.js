const express = require('express');
const Router = express.Router();

const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

app.post('/login', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            return res.status(400).json({ error: 'WalletAddres are required!' });
        }
        const student = await Student.findOne({ walletAddress });
        if (student) {
            return res.status(200).json({ message: 'Login successful...', role: 'student', user: student });
        }
        const teacher = await Teacher.findOne({ walletAddress });
        if (teacher) {
            return res.status(200).json({ message: 'Login successful...', role: 'teacher', user: teacher });
        }
        return res.status(400).json({ error: 'Invalid credentials!' });
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

module.exports = Router;