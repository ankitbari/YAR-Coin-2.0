const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');

const { SEPOLIA_RPC_URL, ADMIN_PRIVATE_KEY, YAR_CONTRACT_ADDRESS, ADMIN_REWARD_RATE } = require('../utils/env');
const asyncHandler = require('../utils/asyncHandler');
const Admin = require('../models/Admin');

const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
const contractAddress = YAR_CONTRACT_ADDRESS;
const abi = ["function transfer(address to, uint256 value) public returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"];
const contract = new ethers.Contract(contractAddress, abi, wallet);

Router.get('/', asyncHandler(async (req, res) => {
    const admins = await Admin.find().lean();
    res.status(200).json({ success: true, message: "Admins retrieved successfully...!", data: admins });
}));

Router.post('/', asyncHandler(async (req, res) => {
    let { walletAddress, email } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ success: false, message: "Missing wallet address...!", error: "MISSING_WALLET_ADDRESS" });
    }
    walletAddress = walletAddress.toLowerCase();
    if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({ success: false, message: "Invalid Ethereum wallet address...!", error: "INVALID_WALLET_ADDRESS" });
    }
    const existing = await Admin.findOne({ $or: [{ walletAddress }, { email }] });
    if (existing) {
        return res.status(400).json({ success: false, message: "Wallet address or email already registered...!", error: "WALLET_OR_EMAIL_ALREADY_REGISTERED" });
    }
    const amount = ethers.parseUnits(ADMIN_REWARD_RATE.toString(), 18);
    let tx, YARBalance = 0;
    try {
        tx = await contract.transfer(walletAddress, amount);
        await tx.wait();
        const balance = await contract.balanceOf(walletAddress);
        YARBalance = Number(ethers.formatUnits(balance, 18));
    } catch (err) {
        console.error(`Blockchain transaction failed}: ${err.message}`);
        return res.status(500).json({ success: false, message: "Blockchain transaction failed...!", error: "TRANSFER_FAILED" });
    }
    const admin = new Admin({ ...req.body, walletAddress, purse: YARBalance });
    await admin.save();
    return res.status(200).json({ message: "Registered successfully...!", data: admin.toObject(), txHash: tx.hash });
}));

module.exports = Router;