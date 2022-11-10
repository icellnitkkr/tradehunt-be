const mongoose = require("mongoose");
const User = require("./user");

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Contest title is required"],
    },
    organiser: {
      type: String,
      required: [true, "Organiser name is required"],
    },
    desc: {
      type: String,
      required: [true, "Contest description is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Contest timeline is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Contest timeline is required"],
    },
    coverImg: {
      type: String,
      required: [true, "Cover Image is required"],
    },
    initialSum: {
      type: Number,
      required: [true, "Amount is required"],
    },
    prizes: {
      type: [],
    },
    assets: {
      type: [String],
      required: [true, "Asset/s is/are required"],
    },
    leaderboardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leaderboard",
    },
    // participants: {
    //   type: [{
    //     user_id: igdgi,
    //     walletAmount
    //     orders: [],
    //     holdings: []
    //   }]
    // }
    //userTokens: [{
    // email: akjh,
    // userToken: "87638"
    // }]
    userTokens: [
      {
        type: String,
      }
    ],
    participants: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        walletAmount: {
          type: Number,
          required: true,
        },
        orders: {
          type: [],
          required: true,
        },
        holdings: {
          type: [],
          required: true,
        },
        userToken: {
          type: String,
          required: true,
        },
        promotion: {},
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("contest", contestSchema);
