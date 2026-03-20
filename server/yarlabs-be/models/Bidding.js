const mongoose = require('mongoose');

const biddingSchema = new mongoose.Schema({
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    bidAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Bidding', biddingSchema);