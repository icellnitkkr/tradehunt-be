const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true
        },
        amount: {
            type: Number,
            required: true
        },
        percentChangeToday: {
            type: Number
        },
        percentChangeOverall: {
            type: Number
        },
        walletBalance: {
            type: Number
        },
        Positions: {
            assetName: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            invested: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            itp: {
                type: String,
                required: true
            }
        }
    }
)

module.exports = mongoose.model("Portfolio", portfolioSchema);