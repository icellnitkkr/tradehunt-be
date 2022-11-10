const mongoose = require("mongoose");

const orderBookSchema = new mongoose.Schema(
    {
        Type: {
            type: String,
            required: true
        },
        assetName: {
            type: String,
            required: true
        },
        time: {
            type: Date
        },
        amount: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
    }
);

module.exports = mongoose.model("Orderbook", orderBookSchema);