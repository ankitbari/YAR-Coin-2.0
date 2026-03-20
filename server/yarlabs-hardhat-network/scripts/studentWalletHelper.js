const Member = require('../models/Member');
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
        const members = await Member.find();
        res.status(200).json(members);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

Router.post('/', async (req, res) => {
    try {
        if (currentAccountIndex >= hardhatAccounts.length) {
            return res.status(400).json({ error: 'No more hardhat member accounts available.' });
        }
        const walletAddress = hardhatAccounts[currentAccountIndex];
        req.body.walletAddress = walletAddress;
        currentAccountIndex++;
        const member = new Member(req.body);
        await member.save();
        res.status(200).json(member);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = Router;