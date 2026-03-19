const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');

const asyncHandler = require('../utils/asyncHandler');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

Router.post('/login', asyncHandler(async (req, res) => {
    let { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ success: false, message: "WalletAddress is required...!", error: "VALIDATION_ERROR" });
    }
    walletAddress = walletAddress.toLowerCase();
    if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({ success: false, message: "Invalid wallet address...!", error: "INVALID_ADDRESS" });
    }
    const [student, teacher] = await Promise.all([
        Student.findOne({ walletAddress }).lean(),
        Teacher.findOne({ walletAddress }).lean()
    ]);
    const user = student || teacher;
    if (!user) {
        return res.status(404).json({ success: false, message: 'Invalid credentials...!', error: "USER_NOT_FOUND" });
    }
    return res.status(200).json({ success: true, message: "Login successful...!", data: { role: student ? `student` : `teacher`, user } });
}));

module.exports = Router;