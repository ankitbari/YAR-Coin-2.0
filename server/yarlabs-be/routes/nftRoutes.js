const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');
const NFT = require('../models/NFT');
const Student = require('../models/Member');
const Teacher = require('../models/Admin');

Router.get('/nft/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        if (!walletAddress) {
            return res.status(400).json({ message: "Member not found" });
        }
        const nfts = await NFT.find({ assignedTo: walletAddress })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: nfts.length, nfts });
    } catch (err) {
        res.status(500).json({ success: false, message: "server error" });
    }
});

Router.post('/nft', async (req, res) => {
    try {
        const { title, description, assignedTo, assignedBy } = req.body;
        if (!title || !assignedBy || !assignedTo) {
            return res.status(400).json({ message: "Missing required fields!" });
        }
        const existingNFT = await NFT.findOne({ title });
        if (existingNFT) {
            return res.status(400).json({ message: "NFT with this tag already exists!" });
        }
        const student = await Student.findOne({ walletAddress: assignedTo });
        const teacher = await Teacher.findOne({ walletAddress: assignedBy });
        if (!student || !teacher) {
            return res.status(400).json({ message: "Admin or Member wallet not found!" });
        }
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const abi = ["function mint(address student) public",
                     "function nextTokenId() view returns (uint256)"];
        const contract = new ethers.Contract(process.env.NFT_CONTRACT_ADDRESS, abi, wallet);
        const tokenId = (await contract.nextTokenId()).toString();
        let tx;
        try {
            tx = await contract.mint(student.walletAddress);
            await tx.wait();
        } catch (blockchainError) {
            return res.status(500).json({ message: "Blockchain transaction failed!", error: blockchainError.reason });
        }
        const newNFT = new NFT({ title, description, assignedTo, assignedBy, txHash: tx.hash, tokenId });
        await newNFT.save();
        res.status(200).json({ message: "NFT minted successfully...", tokenId: tokenId });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = Router;