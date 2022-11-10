const mongoose = require("mongoose");

const leaderBoardSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "contest",
    },
    leaderboard: {
      type: [
        {
          position: {
            type: Number,
            required: true,
          },
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          portfolio: {
            type: Number,
            required: true,
          },
        },
      ],
    },
  },
  {
    timestamps: { updatedAt: true },
  }
);

module.exports = mongoose.model("Leaderboard", leaderBoardSchema);
