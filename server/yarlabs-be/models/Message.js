const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, enum: ["admin", "student"], required: true },
  message: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });
messageSchema.index({ roomId: 1, timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);