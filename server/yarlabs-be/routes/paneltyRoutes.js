const express = require('express');
const Router = express.Router();
const mongoose = require('mongoose');
const { ethers } = require('ethers');

const asyncHandler = require('../utils/asyncHandler');
const Member = require('../models/Member');
const Admin = require('../models/Admin');
const Panelty = require('../models/Panelty');

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contractAddress = process.env.YAR_CONTRACT_ADDRESS;
const abi = ["function transferFrom(address from, address to, uint256 value) public returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)"];
const contract = new ethers.Contract(contractAddress, abi, wallet);

Router.get('/panelty/:walletAddress', asyncHandler(async (req, res) => {
    let { walletAddress } = req.params;
    const walllet = walletAddress.toLowerCase();
    if (!ethers.isAddress(walllet)) {
        return res.status(400).json({ success: false, message: "Invalid wallet address...!", error: "INVALID_WALLET_ADDRESS" });
    }
    const member = await Member.findOne({ walletAddress: walllet });
    if (!member) {
        return res.status(404).json({ success: false, message: "Wallet address not found...!", error: "WALLET_NOT_FOUND" });
    }
    const paneltyHistory = await Panelty.find({ member: member._id }).populate("admin", "name walletAddress").sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: "Panelty history retrieved successfully...!", data: paneltyHistory, totalPanelty: paneltyHistory.length });
}));

Router.post("/panelty", asyncHandler(async (req, res) => {
    let { fromWallet, toWallet, amount, description } = req.body;
    if (!fromWallet || !toWallet || !amount) {
        return res.status(400).json({ success: false, message: "Missing required fields...!", error: "MISSING_FIELDS" });
    }
    const from = fromWallet.toLowerCase();
    const to = toWallet.toLowerCase();
    if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
        return res.status(400).json({ success: false, message: "Invalid wallet address...!", error: "INVALID_WALLET_ADDRESS" });
    }
    const paneltyAmount = parseFloat(amount);
    if (!paneltyAmount || paneltyAmount <= 0) {
        return res.status(400).json({ success: false, message: "Enter valid panelty amount...!", error: "INVALID_PANELTY_AMOUNT" });
    }
    const [member, admin] = await Promise.all([
        Member.findOne({ walletAddress: from }),
        Admin.findOne({ walletAddress: to })
    ]);
    if (!member || !admin) {
        return res.status(404).json({ success: false, message: "User not found...!", error: "USER_NOT_FOUND" });
    }
    const parseAmount = ethers.parseUnits(paneltyAmount.toString(), 18);
    const [allowance, balance] = await Promise.all([
        contract.allowance(member.walletAddress, wallet.address),
        contract.balanceOf(member.walletAddress)
    ]);
    if (allowance < parseAmount) {
        return res.status(400).json({ success: false, message: "Member has not enough approved YAR's...!", error: "INSUFFICIENT_APPROVAL" });
    }
    if (balance < parseAmount) {
        return res.status(400).json({ success: false, message: "Member has insufficient YAR balance...!", error: "INSUFFICIENT_BALANCE" });
    }
    if (member.yarBalance < paneltyAmount) {
        return res.status(400).json({ success: false, message: "No sufficient YAR's on member's balance...!", error: "INSUFFICIENT_BALANCE" })
    }
    try {
    const tx = await contract.transferFrom(member.walletAddress, admin.walletAddress, parseAmount);
    await tx.wait();
    } catch (err) {
        return res.status(500).json({ success: false, message: "Blockchain transaction failed...!", error: "TRANSACTION_FAILED", error: err.message });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        member.yarBalance -= paneltyAmount;
        admin.purse += paneltyAmount;
        await member.save({ session });
        await admin.save({ session });
        const panelty = new Panelty({ member: member._id, admin: admin._id, amount: paneltyAmount, description });
        await panelty.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(201).json({ success: true, message: "Penalty applied successfully...!", data: panelty });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}));

module.exports = Router;