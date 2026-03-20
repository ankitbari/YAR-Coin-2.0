const Admin = require('../models/Admin');
const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

let hardhatAccounts = [];
let currentAccountIndex = 1;
const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_RPC);
(async () => {
    try {
        const addresses = await provider.send("eth_accounts", []);
        hardhatAccounts = addresses;
    } catch (err) {
        console.error("Error loading Hardhat accounts:", err);
    }
})();
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);
const tokenAbi = [
    "function transfer(address to, uint amount) public returns (bool)",
    "function balanceOf(address account) public view returns (uint256)"
];
const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, deployerWallet);

Router.get('/', async (req, res) => {
    try {
        const admins = await Admin.find();
        res.status(200).json(admins);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

Router.post('/', async (req, res) => {
    try {
        if (currentAccountIndex >= 6) {
        return res.status(400).json({ error: 'No more hardhat admin accounts available.' });
        }
        const walletAddress = hardhatAccounts[currentAccountIndex];
        const amount = ethers.parseUnits("10000", 18);
        const tx = await tokenContract.transfer(walletAddress, amount);
        await tx.wait();
        req.body.walletAddress = walletAddress;
        currentAccountIndex++;

        const admin = new Admin(req.body);
        await admin.save();
        res.status(200).json(admin);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = Router;