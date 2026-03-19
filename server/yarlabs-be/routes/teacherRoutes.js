const Teacher = require('../models/Teacher');
const express = require('express');
const Router = express.Router();
const { ethers } = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

Router.get('/', async (req, res) => {
    try {
        const teachers = await Teacher.find();
        res.status(200).json(teachers);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

Router.post('/', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            return res.status(400).json({ error: "Connect to Metamask wallet!" });
        }
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const contractAddress = process.env.YAR_CONTRACT_ADDRESS;
        const abi = ["function transfer(address to, uint256 value) public returns (bool)",
            "function balanceOf(address owner) view returns (uint256)"];
        const contract = new ethers.Contract(contractAddress, abi, wallet);
        const amount = ethers.parseUnits("100", 18);
        const tx = await contract.transfer(walletAddress, amount);
        await tx.wait();
        const balance = await contract.balanceOf(walletAddress);
        const YARBalance = Number(ethers.formatUnits(balance, 18));
        const teacher = new Teacher({ ...req.body, purse: YARBalance });
        await teacher.save();
        return res.status(200).json({ message: "Registered successfully...", txHash: tx.hash, contractAddress: contractAddress });
    } catch (err) {
        return res.status(500).json({ message: "Transfer failed!" });
    }
});

module.exports = Router;