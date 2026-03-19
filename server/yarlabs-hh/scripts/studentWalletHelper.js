const Student = require('../models/Student');
const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

let hardhatAccounts = [];
let currentAccountIndex = 7;
const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_RPC);
(async () => {
    try {
        const addresses = await provider.send("eth_accounts", []);
        hardhatAccounts = addresses;
    } catch (err) {
        console.error("Error loading Hardhat accounts:", err);
    }
})();

Router.get('/', async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

Router.post('/', async (req, res) => {
    try {
        if (currentAccountIndex >= hardhatAccounts.length) {
            return res.status(400).json({ error: 'No more hardhat student accounts available.' });
        }
        const walletAddress = hardhatAccounts[currentAccountIndex];
        req.body.walletAddress = walletAddress;
        currentAccountIndex++;
        const student = new Student(req.body);
        await student.save();
        res.status(200).json(student);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = Router;