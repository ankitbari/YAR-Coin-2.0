const express = require('express');
const Router = express.Router();

const asyncHandler = require('../utils/asyncHandler');
const Member = require('../models/Member');
const Admin = require('../models/Admin');
const Bidding = require('../models/Bidding');

Router.get('/member/:memberId', asyncHandler(async (req, res) => {
    const bids = await Bidding.find({ memberId: req.params.memberId }).sort({ bidAmount: -1 }).lean();
    res.status(200).json({ success: true, message: "Bids retrieved successfully...!", data: bids });
}));

Router.post('/admin', asyncHandler(async (req, res) => {
    const { memberId, adminId, bidAmount } = req.body;
    if (!memberId || !adminId || !bidAmount) {
        return res.status(400).json({ success: false, message: "Missing required fields...!", error: "VALIDATION_ERROR" });
    }
    const [member, admin] = await Promise.all([
        Member.findById(memberId),
        Admin.findById(adminId)
    ]);
    if (!member) {
        return res.status(404).json({ success: false, message: "Member not found...!", error: "MEMBER_NOT_FOUND" });
    }
    if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found...!", error: "ADMIN_NOT_FOUND" });
    }
    const highestBid = await Bidding.findOne({ memberId }).sort({ bidAmount: -1 });
    if (!highestBid && bidAmount < member.basePrice) {
        return res.status(400).json({ success: false, message: `First bid must be at least the base price of ${member.basePrice}...!`, error: "BID_BELOW_BASE_PRICE" });
    }
    if (highestBid && bidAmount <= highestBid.bidAmount) {
        return res.status(400).json({ success: false, message: `Bidding amount must be higher than current bid of ${highestBid.bidAmount}...!`, error: "BID_TOO_LOW" });
    }
    const bidding = new Bidding({ memberId, adminId, bidAmount });
    await bidding.save();
    res.status(201).json({ success: true, message: "Bid placed successfully...!", data: bidding });
}));

module.exports = Router;