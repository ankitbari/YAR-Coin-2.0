const { default: mongoose } = require("mongoose");

const PaneltySchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Panelty', PaneltySchema);