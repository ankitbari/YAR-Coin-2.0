const mongoose = require('mongoose');

const DEXSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, index: true },
    fromYar: { type: Number, required: true, min: 0 },
    usdBalance: { type: Number, required: true, min: 0 },
    totalUsd: { type: Number, default: 0 },
    txHash: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('DEX', DEXSchema);