const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	email: { type: String, unique: true, required: true, lowercase: true, trim: true },
	walletAddress: { type: String, unique: true, required: true, lowercase: true, trim: true },
	specialization: { type: [String], default: [] },
	purse: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Admin', adminSchema);