const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');

const asyncHandler = require('../utils/asyncHandler');
const NFT = require('../models/NFT');
const Member = require('../models/Member');
const Admin = require('../models/Admin');

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const abi = ["function mint(address student) public",
    "function nextTokenId() view returns (uint256)"];
const contract = new ethers.Contract(process.env.NFT_CONTRACT_ADDRESS, abi, wallet);

Router.get('/nft/:walletAddress', asyncHandler(async (req, res) => {
    let { walletAddress } = req.params;
    if (!walletAddress) {
        return res.status(404).json({ success: false, message: "Member not found...!", error: "MEMBER_NOT_FOUND" });
    }
    walletAddress = walletAddress.toLowerCase();
    if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({ success: false, message: "Invalid wallet address...!", error: "INVALID_WALLET_ADDRESS" });
    }
    const nfts = await NFT.find({ assignedTo: walletAddress }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: "NFTs retrieved successfully...!", data: nfts, count: nfts.length });
}));

Router.post('/nft', asyncHandler(async (req, res) => {
    let { title, description, assignedTo, assignedBy } = req.body;
    if (!title || !assignedBy || !assignedTo) {
        return res.status(400).json({ success: false, message: "Missing required fields...!", error: "MISSING_REQUIRED_FIELDS" });
    }
    const to = assignedTo.toLowerCase();
    const by = assignedBy.toLowerCase();
    if (!ethers.isAddress(to) || !ethers.isAddress(by)) {
        return res.status(400).json({ success: false, message: "Invalid wallet address...!", error: "INVALID_WALLET_ADDRESS" });
    }
    const [member, admin] = await Promise.all([
        Member.findOne({ walletAddress: to }),
        Admin.findOne({ walletAddress: by })
    ]);
    if (!member || !admin) {
        return res.status(404).json({ success: false, message: "User not found...!", error: "USER_NOT_FOUND" });
    }
    const existingNFT = await NFT.findOne({ title });
    if (existingNFT) {
        return res.status(409).json({ success: false, message: "NFT with this tag already exists...!", error: "NFT_EXISTS" });
    }
    let tx;
    try {
        tx = await contract.mint(member.walletAddress);
        await tx.wait();
    } catch (err) {
        return res.status(500).json({ success: false, message: "Blockchain transaction failed...!", error: err.message });
    }
    const tokenId = (await contract.nextTokenId()).toString();
    const newNFT = new NFT({ title, description, assignedTo, assignedBy, txHash: tx.hash, tokenId });
    await newNFT.save();
    res.status(201).json({ success: true, message: "NFT minted successfully...!", data: newNFT, txHash: tx.hash, tokenId: tokenId });
}));

module.exports = Router;