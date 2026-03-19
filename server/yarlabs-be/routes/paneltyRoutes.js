const express = require('express');
const Student = require('../models/Member');
const Teacher = require('../models/Teacher');
const Panelty = require('../models/Panelty');
const { ethers, ContractTransactionReceipt } = require('ethers');
const Router = express.Router();

Router.get('/panelty/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const student = await Student.findOne({ walletAddress });
        if (!student) {
            return res.status(400).json({ message: "Wallet address not found" });
        }
        const paneltyHistory = await Panelty.find({ student: student._id }).populate("teacher", "name walletAddress").sort({ createdAt: -1 });
        res.status(200).json({ totalPanelty: paneltyHistory.length, history: paneltyHistory });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

Router.post("/panelty", async (req, res) => {
    try {
        const { fromWallet, toWallet, amount, description } = req.body;
        if (!fromWallet || !toWallet || !amount) {
            return res.status(400).json({ message: "Missing one of the wallet address or amount" });
        }
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const contractAddress = process.env.YAR_CONTRACT_ADDRESS;
        const abi = ["function transferFrom(address from, address to, uint256 value) public returns (bool)",
                     "function allowance(address owner, address spender) view returns (uint256)",
                     "function balanceOf(address owner) view returns (uint256)"];
        const contract = new ethers.Contract(contractAddress, abi, wallet);
        const student = await Student.findOne({ walletAddress: fromWallet });
        const teacher = await Teacher.findOne({ walletAddress: toWallet });
        if (!student || !teacher) {
            return res.status(404).json({ message: "Admin or Member not found" });
        }
        const paneltyAmount=parseFloat(amount);
        if (isNaN(paneltyAmount) || paneltyAmount<=0){
            return res.status(400).json({message: "Enter valid panelty amount!"});
        }
        if (student.yarBalance < paneltyAmount) {
            return res.status(400).json({ message: "No sufficient YAR's on member's balance!" })
        }
        try{
            const parseAmount = ethers.parseUnits(paneltyAmount.toString(), 18);
            const allowance = await contract.allowance(student.walletAddress, wallet.address);
            if (allowance<parseAmount){
                return res.status(400).json({message: "Member has not enough approved YAR's!"});
            }
            const balance = await contract.balanceOf(student.walletAddress);
            if (balance<parseAmount){
                return res.status(400).json({message: "Member has insufficient YAR balance!"});
            }
            const tx = await contract.transferFrom(student.walletAddress, teacher.walletAddress, parseAmount);
            await tx.wait();
            student.yarBalance -= paneltyAmount;
            teacher.purse += paneltyAmount;
            await student.save();
            await teacher.save();
            const panelty = new Panelty({student: student._id, teacher: teacher._id, amount: paneltyAmount, description});
            await panelty.save();
            return res.status(200).json({ message: "Penalty applied successfully", panelty });
        }catch(err){
            return res.status(500).json({message: "Blockchain transaction failed", error: err.message});
        }
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message });
    }
});

module.exports = Router;