const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');
const DEX = require('../models/DEX');
const Student = require('../models/Student');

Router.get('/transactions/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        if (!walletAddress) {
            return res.status(400).json({ success: false, message: "Wallet address required" });
        }
        const transactions = await DEX.find({ walletAddress }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: transactions.length, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

Router.post('/convert', async (req, res) => {
    try {
        const { walletAddress, yarAmount, txHash } = req.body;
        if (!walletAddress || !yarAmount || !txHash) {
            return res.status(400).json({ success: false, message: "Missing details!" });
        }
        const amount = Number(yarAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid YAR amount!" });
        }
        const student = await Student.findOne({ walletAddress });
        if (!student) {
            return res.status(400).json({ message: "Member not found!" });
        }
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt || receipt.status !== 1) {
            return res.status(400).json({ message: "Blockchain transaction failed!" });
        }
        if (receipt.to.toLowerCase() !== process.env.DEX_CONTRACT_ADDRESS.toLowerCase()) {
            return res.status(400).json({ message: "Invalid transaction intersection!" });
        }
        const iface = new ethers.Interface([
            "event Converted(address user, uint256 yarAmount, uint256 usdValue)"
        ]);
        let validEvent = false;
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog(log);
                if (
                    parsed &&
                    parsed.name === "Converted" &&
                    parsed.args.user.toLowerCase() === walletAddress.toLowerCase()
                ) {
                    validEvent = true;
                    break;
                }
            } catch (e) { }
        }
        if (!validEvent) {
            return res.status(400).json({ success: false, message: "Invalid conversion event" });
        }
        if (student.yarBalance < amount) {
            return res.status(400).json({ message: "Insuffucient YAR balance!" });
        }
        const usdValue = amount * 0.5;
        student.yarBalance -= amount;
        await student.save();
        const total = await DEX.aggregate([
            { $match: { walletAddress } },
            {
                $group: {
                    _id: null,
                    totalUsd: { $sum: "$usdBalance" }
                }
            }
        ]);
        const previousTotal = total.length > 0 ? total[0].totalUsd : 0;
        const newTotalUsd = previousTotal + usdValue;
        await DEX.create({ walletAddress, fromYar: amount, usdBalance: usdValue, totalUsd: newTotalUsd, txHash });
        res.json({ success: true, message: "YAR to USD converted successfully...", convertedUsd: usdValue, totalUsd: newTotalUsd, txHash: txHash });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

module.exports = Router;