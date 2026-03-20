const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    walletAddress: { type: String, unique: true, required: true, lowercase: true, trim: true },
    skills: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    basePrice: { type: Number, default: 0 },
    yarBalance: { type: Number, default: 0 },
    ownedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Member', memberSchema);