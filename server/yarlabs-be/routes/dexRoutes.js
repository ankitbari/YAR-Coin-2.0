const express = require('express');
const Router = express.Router();
const mongoose = require('mongoose');
const { ethers } = require('ethers');

const asyncHandler = require('../utils/asyncHandler');
const DEX = require('../models/DEX');
const Member = require('../models/Member');

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

Router.get('/transactions/:walletAddress', asyncHandler(async (req, res) => {
    let { walletAddress } = req.params;
    if (!walletAddress) {
        return res.status(400).json({ success: false, message: "Wallet address required...!", error: "MISSING_WALLET_ADDRESS" });
    }
    walletAddress = walletAddress.toLowerCase();
    if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({ success: false, message: "Invalid wallet address...!", error: "INVALID_WALLET_ADDRESS" });
    }
    const transactions = await DEX.find({ walletAddress }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: "Transactions retrieved successfully...!", data: transactions, count: transactions.length });
}));

Router.post('/convert', asyncHandler(async (req, res) => {
    let { walletAddress, yarAmount, txHash } = req.body;
    if (!walletAddress || !yarAmount || !txHash) {
        return res.status(400).json({ success: false, message: "Missing details...!", error: "MISSING_DETAILS" });
    }
    walletAddress = walletAddress.toLowerCase();
    if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({ success: false, message: "Invalid wallet address...!", error: "INVALID_WALLET_ADDRESS" });
    }
    const amount = Number(yarAmount);
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid YAR amount...!", error: "INVALID_YAR_AMOUNT" });
    }
    const existingTx = await DEX.findOne({ txHash: txHash });
    if (existingTx) {
        return res.status(409).json({ success: false, message: "Transaction already processed...!", error: "DUPLICATE_TRANSACTION" });
    }
    const member = await Member.findOne({ walletAddress });
    if (!member) {
        return res.status(404).json({ success: false, message: "Member not found...!", error: "MEMBER_NOT_FOUND" });
    }
    let receipt;
    try {
        receipt = await provider.getTransactionReceipt(txHash);
    } catch (err) {
        return res.status(400).json({ success: false, message: "Error fetching transaction receipt...!", error: "TRANSACTION_RECEIPT_ERROR" });
    }
    if (!receipt || receipt.status !== 1) {
        return res.status(400).json({ success: false, message: "Blockchain transaction failed...!", error: "BLOCKCHAIN_TRANSACTION_FAILED" });
    }
    if (receipt.to.toLowerCase() !== process.env.DEX_CONTRACT_ADDRESS.toLowerCase()) {
        return res.status(400).json({ success: false, message: "Invalid transaction intersection...!", error: "INVALID_TRANSACTION_INTERSECTION" });
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
        return res.status(400).json({ success: false, message: "Invalid conversion event...!", error: "INVALID_CONVERSION_EVENT" });
    }
    if (member.yarBalance < amount) {
        return res.status(400).json({ success: false, message: "Insufficient YAR balance...!", error: "INSUFFICIENT_YAR_BALANCE" });
    }
    const usdValue = amount * 0.5;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        member.yarBalance -= amount;
        await member.save({ session });
        const total = await DEX.aggregate([
            { $match: { walletAddress } },
            {
                $group: {
                    _id: null,
                    totalUsd: { $sum: "$usdBalance" }
                }
            }
        ]).session(session);
        const previousTotal = total.length > 0 ? total[0].totalUsd : 0;
        const newTotalUsd = previousTotal + usdValue;
        await DEX.create([{ walletAddress, fromYar: amount, usdBalance: usdValue, totalUsd: newTotalUsd, txHash: txHash }], { session });
        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "YAR to USD converted successfully...!", convertedUsd: usdValue, totalUsd: newTotalUsd, txHash: txHash });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: "Conversion failed...!", error: "CONVERSION_FAILED" });
    }
}));

module.exports = Router;