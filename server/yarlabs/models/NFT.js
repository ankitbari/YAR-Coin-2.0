const mongoose = require('mongoose');

const NFTSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "" },
    assignedTo: { type: String, required: true },
    assignedBy: { type: String, required: true },
    txHash: { type: String, required: true },
    tokenId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('NFT', NFTSchema);