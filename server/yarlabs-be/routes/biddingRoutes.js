const express = require('express');
const Router = express.Router();

const asyncHandler = require('../utils/asyncHandler');
const Student = require('../models/Member');
const Teacher = require('../models/Admin');
const Bidding = require('../models/Bidding');

Router.get('/member/:memberId', asyncHandler(async (req, res) => {
    const bids = await Bidding.find({ studentId: req.params.memberId }).sort({ bidAmount: -1 }).lean();
    res.status(200).json({ success: true, message: "Bids retrieved successfully...!", data: bids });
}));

Router.post('/admin', asyncHandler(async (req, res) => {
    const { studentId, teacherId, bidAmount } = req.body;
    if (!studentId || !teacherId || !bidAmount) {
        return res.status(400).json({ success: false, message: "Missing required fields...!", error: "VALIDATION_ERROR" });
    }
    const [student, teacher] = await Promise.all([
        Student.findById(studentId),
        Teacher.findById(teacherId)
    ]);
    if (!student) {
        return res.status(404).json({ success: false, message: "Student not found...!", error: "STUDENT_NOT_FOUND" });
    }
    if (!teacher) {
        return res.status(404).json({ success: false, message: "Teacher not found...!", error: "TEACHER_NOT_FOUND" });
    }
    const highestBid = await Bidding.findOne({ studentId }).sort({ bidAmount: -1 });
    if (!highestBid && bidAmount < student.basePrice) {
        return res.status(400).json({ success: false, message: `First bid must be at least the base price of ${student.basePrice}...!`, error: "BID_BELOW_BASE_PRICE" });
    }
    if (highestBid && bidAmount <= highestBid.bidAmount) {
        return res.status(400).json({ success: false, message: `Bidding amount must be higher than current bid of ${highestBid.bidAmount}...!`, error: "BID_TOO_LOW" });
    }
    const bidding = new Bidding({ studentId, teacherId, bidAmount });
    await bidding.save();
    res.status(201).json({ success: true, message: "Bid placed successfully...!", data: bidding });
}));

module.exports = Router;