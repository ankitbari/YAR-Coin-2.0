const { default: mongoose } = require("mongoose");

const PaneltySchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Panelty', PaneltySchema);