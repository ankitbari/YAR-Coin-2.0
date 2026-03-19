const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');

const asyncHandler = require('../utils/asyncHandler');
const Member = require('../models/Member');

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contractAddress = process.env.YAR_CONTRACT_ADDRESS;
const abi = ["function balanceOf(address owner) view returns (uint256)"];
const contract = new ethers.Contract(contractAddress, abi, wallet);

Router.get('/', asyncHandler(async (req, res) => {
    const member = await Member.find().lean();
    res.status(200).json({ success: true, message: "Members retrieved successfully...!", data: member });
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
    const existing = await Member.findOne({ $or: [{ walletAddress }, { email }] });
    if (existing) {
        return res.status(400).json({ success: false, message: "Wallet address or email already registered...!", error: "WALLET_OR_EMAIL_ALREADY_REGISTERED" });
    }
    let YARBalance = 0;
    try {
        const balance = await contract.balanceOf(walletAddress);
        YARBalance = Number(ethers.formatUnits(balance, 18));
    } catch (err) {
        console.error(`Blockchain transaction failed}: ${err.message}`);
    }
    const member = new Member({ ...req.body, walletAddress, yarBalance: YARBalance });
    await member.save();
    return res.status(201).json({ success: true, message: "Registered successfully...!", data: member.toObject() });
}));

module.exports = Router;