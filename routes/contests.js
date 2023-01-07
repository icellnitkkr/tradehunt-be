const router = require("express").Router();
const Contest = require("../models/contest");
const fetch = require("node-fetch");
const Leaderboard = require("../models/Leaderboard");
const nodemailer = require("nodemailer");

const {
  calculateLeaderBoard,
} = require("../controllers/leaderBoardController");
const allowedSymbols = require("../utils/allowedSymbols.json");

router.get("/getAllowedSymbols", async (req, res) => {
  res.status(200).json({ success: true, allowedSymbols });
});

router.post("/create", async (req, res) => {
  try {
    //  add error handling for missing fields <--DONE
    await Contest.insertMany([req.body]).then((contest) => {
      Leaderboard.insertMany([
        {
          contestId: contest[0]._id,
          leaderboard: [],
        },
      ]).then((data) => {
        Contest.findByIdAndUpdate(contest[0]._id, {
          leaderboardId: data[0]._id,
        }).then((data1) => {
          console.log(data1);
        });
      });
    });
    res.status(200).json({
      message: "Contest Created Successfully",
      data: { Contest },
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: {
        name: err.name,
        message: err.message || "Internal Server Error",
      },
    });
  }
});

// get curr contests -> active & upcoming -> endDate:{$gte:currDate}
router.get("/getActiveAndUpcomingContests", async (req, res) => {
  const { user } = req;
  const currDate = new Date();
  try {
    const contests = await Contest.find({
      endDate: { $gte: currDate },
    });
    const data = contests.map((contest) => {
      const {
        _id,
        title,
        organiser,
        startDate,
        endDate,
        coverImg,
        participants,
        desc,
        prizes,
        initialSum,
        leaderboardId,
      } = contest;
      return {
        _id,
        title,
        organiser,
        startDate,
        endDate,
        coverImg,
        desc,
        prizes,
        initialSum,
        leaderboardId,
        promotion: contest._doc.promotion,
        active: startDate <= currDate,
        users: participants.length,
        registered:
          participants.findIndex(
            (participant) => participant.user_id == user.id
          ) >= 0
            ? true
            : false,
      };
    });
    res.status(200).send({
      success: true,
      data,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: "Unable to fetch contests" });
  }
});

// get all contests -> if(contest.participants.find(user)) => userParticipated: true? false

//get past contests
router.get("/past", async (req, res) => {
  try {
    const currDate = new Date();
    const pastContest = await Contest.find({ endDate: { $lt: currDate } });
    res.status(200).json(pastContest);
  } catch (err) {
    res.status(500).json(err);
  }
});

//register for contest
// contest -> participants mein insert user id orders array = []
// wallet amount = contest ki initial money

//getAllAssets
//getAllAssets
// array of allowed assets
// getCurrentPrice
//getAssetDetails

//createOrder
///getHistory

router.get("/getOrderHistory/:contestId", async (req, res) => {
  const { user } = req;
  const { contestId } = req.params;
  try {
    Contest.findOne({ _id: contestId }).then((contest) => {
      const userObj = contest.participants.find((u) => u.user_id == user.id);
      res.status(200).send({
        success: true,
        history: userObj.orders,
      });
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      error: e,
    });
  }
});

router.get("/getHoldings/:contestId", async (req, res) => {
  const { user } = req;
  const { contestId } = req.params;
  try {
    Contest.findOne({ _id: contestId }).then((contest) => {
      const userObj = contest.participants.find((u) => u.user_id == user.id);
      res.status(200).send({
        success: true,
        holdings: userObj.holdings,
        walletAmount: userObj.walletAmount,
      });
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      error: e,
    });
  }
});

router.get("/getAssetDetails/:contestId/:token", async (req, res) => {
  const { user } = req;
  const { contestId, token } = req.params;
  console.log(token, contestId, user);
  try {
    Contest.findOne({ _id: contestId }).then((contest) => {
      const userObj = contest.participants.find(
        (usr) => usr.user_id == user.id
      );
      const walletAmount = userObj.walletAmount;
      const holdings = userObj.holdings.find(
        (holding) => holding.token == token
      );
      res.status(200).send({
        success: true,
        data: {
          holdings,
          walletAmount,
        },
      });
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      error: e,
    });
  }
});
router.get("/getUserPortfolio/:contestId", async (req, res) => {
  const { user } = req;
  const { contestId } = req.params;
  const symbols = Object.keys(allowedSymbols);
  try {
    fetch("https://api.binance.com/api/v3/ticker/price")
      .then((res) => res.json())
      .then((d) => {
        let prices = {};
        for (let symbol of d) {
          if (symbols.includes(symbol.symbol)) {
            prices[symbol.symbol] = Number(symbol.price);
          }
        }
        Contest.findOne({
          _id: contestId,
        }).then((contest) => {
          const initialSum = contest.initialSum;
          const userObj = contest.participants.find(
            (u) => u.user_id == user.id
          );
          const { walletAmount, holdings } = userObj;
          let portfolio = walletAmount;
          for (const holding of holdings) {
            portfolio += prices[holding.token] * holding.qty;
          }
          res.status(200).send({
            portfolio,
            walletAmount,
            success: true,
            change: (((portfolio - initialSum) * 100) / initialSum).toFixed(2),
          });
        });
      });
  } catch (e) {
    res.status(500).send({
      success: false,
      error: e,
    });
  }
});

router.post("/registerForContest", (req, res) => {
  const { user } = req;
  const { inviteCode, contestId } = req.body;
  try {
    // if (contestId == '624bdfc90c8f68064942d6ac') {
    //   Contest.findOne({
    //     _id: contestId,
    //     userTokens: { $in: [inviteCode] },
    //     startDate: { $lte: new Date() },
    //     endDate: { $gte: new Date() },
    //   }).then((data, rs) => {
    //     if (!data) {
    //       return res
    //         .status(404)
    //         .send({ success: false, err: "Invalid invite code" });
    //     }
    //     if (data.participants.findIndex((p) => p.user_d == user.id) >= 0) {
    //       return res
    //         .status(404)
    //         .send({ success: false, err: "User already registered" });
    //     }
    //     Contest.findOneAndUpdate(
    //       { _id: contestId },
    //       {
    //         $push: {
    //           participants: {
    //             user_id: user.id,
    //             walletAmount: data.initialSum,
    //             orders: [],
    //             portfolio: data.initialSum,
    //             holdings: [],
    //             userToken: inviteCode,
    //           },
    //         },
    //         $pull: {
    //           userTokens: {
    //             $in: [inviteCode],
    //           },
    //         }
    //       }
    //     ).then((data) => {
    //       res.send({ message: "Registered Successfully!", success: true });
    //     });
    //   });
    // }
    // else
    Contest.findOne({
      _id: contestId,
      userTokens: { $in: [inviteCode] },
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).then((data, rs) => {
      if (!data) {
        return res
          .status(404)
          .send({ success: false, err: "Invalid invite code" });
      }
      if (data.participants.findIndex((p) => p.user_d == user.id) >= 0) {
        return res
          .status(404)
          .send({ success: false, err: "User already registered" });
      }
      Contest.findOneAndUpdate(
        { _id: contestId },
        {
          $push: {
            participants: {
              user_id: user.id,
              walletAmount: data.initialSum,
              orders: [],
              portfolio: data.initialSum,
              holdings: [],
              userToken: inviteCode,
            },
          },
        }
      ).then((data) => {
        res.send({ message: "Registered Successfully!", success: true });
      });
    });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

router.post("/sellOrder", async (req, res) => {
  const { qty, token, rate, contestId } = req.body;
  console.log(qty, token, rate, contestId);
  try {
    if (!qty || !token || !rate)
      return res
        .status(400)
        .json({ success: false, message: "Missing Parameters" });
    const contest = await Contest.findOne({ _id: contestId });
    const Seller = contest.participants.find(
      (user) => user.user_id == req.user.id
    );
    const holding = Seller.holdings.find((holding) => holding.token === token);
    if (!holding) {
      return res
        .status(400)
        .json({ success: false, message: "Holding does not exist" });
    }
    if (qty > holding.qty) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough quantity available" });
    }
    holding.qty -= qty;
    const newHoldings = Seller.holdings.map((i) => {
      if (i.token == token) {
        return {
          qty: holding.qty,
          token,
        };
      } else return i;
    });
    if (qty * rate < 1) {
      return res.status(400).send({
        success: false,
        message: "The minimum deal should be of $1.",
      });
    }
    const newWalletAmt = Seller.walletAmount + qty * rate;
    console.log(holding);
    if (holding.qty.toFixed(5) == 0) {
      Contest.findOneAndUpdate(
        { _id: contestId, "participants.user_id": req.user.id },
        {
          $pull: {
            "participants.$.holdings": {
              token: token,
            },
          },
          $set: {
            "participants.$.walletAmount": newWalletAmt,
          },
          $push: {
            "participants.$.orders": {
              token: token,
              qty,
              rate,
              type: "sell",
              time: new Date(),
            },
          },
        }
      ).then((data) => {
        console.log(data);
      });
    } else {
      Contest.findOneAndUpdate(
        { _id: contestId, "participants.user_id": req.user.id },
        {
          $set: {
            "participants.$.holdings": newHoldings,
            "participants.$.walletAmount": newWalletAmt,
          },
          $push: {
            "participants.$.orders": {
              token: token,
              qty,
              rate,
              type: "sell",
              time: new Date(),
            },
          },
        }
      ).then((data) => {
        console.log(data);
      });
    }

    // await contest.save();
    res.status(200).json({ success: true, message: "Order sold successfully" });
  } catch (err) {
    res.status(500).json(err.message);
  }
  //qty*rate add to wallet
  //decrease holdings by qty
});

router.post("/buyOrder", async (req, res) => {
  const { qty, token, rate, contestId } = req.body;
  console.log(qty, token, rate, contestId);
  try {
    if (!qty || !token || !rate)
      return res
        .status(400)
        .json({ success: false, message: "Missing Parameters" });
    const contest = await Contest.findOne({ _id: contestId });
    const Seller = contest.participants.find(
      (user) => user.user_id == req.user.id
    );
    var holding = Seller.holdings.find((holding) => holding.token === token);
    if (qty * rate > Seller.walletAmount) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough amount in wallet" });
    }
    var newHoldings = Seller.holdings.map((i) => {
      if (i.token == token) {
        return {
          qty: Number(Number(holding.qty) + Number(qty)),
          token,
        };
      } else return i;
    });
    if (!holding) {
      newHoldings.push({
        qty,
        token,
      });
    }
    if (qty * rate < 1) {
      return res.status(400).send({
        success: false,
        message: "The minimum deal should be of $1.",
      });
    }
    const newWalletAmt = Seller.walletAmount - qty * rate;
    console.log(newWalletAmt, newHoldings, req.user.id);
    Contest.findOneAndUpdate(
      { _id: contestId, "participants.user_id": req.user.id },
      {
        $set: {
          "participants.$.holdings": newHoldings,
          "participants.$.walletAmount": newWalletAmt,
        },
        $push: {
          "participants.$.orders": {
            token: token,
            qty,
            rate,
            type: "buy",
            time: new Date(),
          },
        },
      }
    ).then((data) => {
      console.log(data);
    });

    // await contest.save();
    res
      .status(200)
      .json({ success: true, message: token + " bought successfully" });
  } catch (err) {
    res.status(500).json(err.message);
  }
  //qty*rate add to wallet
  //decrease holdings by qty
});

router.get("/getPastLeaderboard/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const contest = await Leaderboard.findOne({ _id: id })
      .populate({
        path: "leaderboard",
        populate: {
          path: "user",
          select: "name username profileAvatar",
        },
      })
      .populate("contestId", "initialSum");
    res.status(200).json({ success: true, data: contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get("/getLeaderboard/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let data = await Leaderboard.findOne({ _id: id });
    if (data.updatedAt.getTime() < new Date().getTime() - 1000 * 60 * 15) {
      await calculateLeaderBoard(id, data.contestId);
      data = await Leaderboard.findOne({ _id: id })
        .populate({
          path: "leaderboard",
          populate: {
            path: "user",
            select: "name username profileAvatar",
          },
        })
        .populate("contestId", "initialSum");
    } else {
      data = await Leaderboard.findOne({ _id: id })
        .populate({
          path: "leaderboard",
          populate: {
            path: "user",
            select: "name username profileAvatar",
          },
        })
        .populate("contestId", "initialSum");
    }
    res.status(200).send({ success: true, data });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "cant get leaderboard" });
  }
});

router.get("/getPastContests", (req, res) => {
  Contest.find({
    endDate: { $lte: new Date() },
    startDate: { $lte: new Date() },
  })
    .then((data) => {
      res.send({ success: true, data });
    })
    .catch((err) => {
      res.send({ success: false, err });
    });
});

router.post("/sendMails", async (req, res) => {
  const { _id, mails } = req.body;
  for (var i = 0; i < 208; i++) {
    const res = await Contest.findOneAndUpdate({ _id: _id }, {
      $push: {
        "userTokens": 'xusvtw'
      }
    });
  }
  // for (const i in mails) {
  //   var transporter = nodemailer.createTransport({
  //     service: 'gmail',
  //     auth: {
  //       user: `industrycellkkrnit@gmail.com`,
  //       pass: "ozlfvrearhdykjpy"
  //     }
  //   });

  //   let otp = "";
  //   do {
  //     var check = true;
  //     otp = Math.floor(Math.random() * (999999 - 100000) + 100000);
  //     check = await Contest.findOne({ _id: _id, "userTokens": otp })
  //     console.log("middle", check)

  //   } while (check);
  //   console.log("final", otp)

  //   console.log(mails[i])
  //   var mailOptions = {
  //     from: { name: "Teams ICELL", address: 'industrycellkkrnit@gmail.com' },
  //     to: mails[i],
  //     subject: 'Invite Code for Tradehunt 2022',
  //     html: `<!DOCTYPE html>
  //     <html lang="en">
  //     <head>
  //         <meta charset="UTF-8">
  //         <meta http-equiv="X-UA-Compatible" content="IE=edge">
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //         <link rel="preconnect" href="https://fonts.googleapis.com">
  //     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  //     <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300&display=swap" rel="stylesheet">
  //         <title>Document</title>
  //         <style>
  //             *
  //     {
  //         margin: 0;
  //         padding: 0;
  //         font-family: "Sora",serif;
  //     }

  //     .icell-logo-top
  //     {
  //         width:100%;
  //         height:15vh;
  //         /* border:2px solid red; */
  //         background-color:#282828;
  //         display: flex;
  //         justify-content: center;
  //         align-items: center;
  //     }

  //     .icell-logo-text
  //     {
  //         font-weight: 500;
  //         color:white;
  //         font-size: 20px;
  //         font-family: "Sora",sans-serif;
  //     }

  //     .initial-text
  //     {
  //         line-height: 50px;
  //         margin-top:25px;
  //         margin-left:25px;
  //         margin-right:25px;
  //     }
  //     .initial-text
  //     {
  //         width:75%;
  //         /* height:100vh; */
  //         /* border:2px solid red; */
  //         margin:auto;
  //         font-family: "Sora",sans-serif;
  //     }

  //     .initial-text p
  //     {
  //         color: #282828;
  //     }

  //     .initialheading
  //     {
  //         display:flex;
  //         justify-content: center;
  //         flex-direction: column;
  //         align-items: center;
  //         background-color: #c85454;
  //         margin-bottom:20px;
  //     }
  //     .doubleheading
  //     {
  //         text-transform: uppercase;
  //         color:#123644 ;
  //         position: relative;
  //         width: 50%;
  //         margin: 60px;
  //         display:flex;
  //         justify-content: center;
  //         align-items: center;
  //         border-bottom: 2px solid #123644 ;
  //         padding-bottom:40px;

  //     }
  //     .backletter{
  //         font-size: 5rem;
  //         color: #f4f4f4;
  //         opacity: 0.4;
  //         position: absolute;
  //         left: 0;
  //         right: 0;
  //         top: -30px;
  //         font-family: "JetBrains",serif;
  //         font-weight: 700;
  //         z-index: 0;
  //         margin: auto;

  //         text-align: center;
  //     }
  //     .doubleheading h1
  //     {
  //         font-size: 5.5rem;
  //         color:#123644
  //     }
  //     .button
  //     {
  //         /* border:2px solid red; */
  //         color: #c85454;
  //         padding:20px;
  //         width:200px;
  //         margin:auto;
  //         text-align: center;
  //         background-color: white;
  //         border-radius:25px;
  //         font-family: "Sora",sans-serif;
  //         font-size: 35px;
  //     }

  //     .img img
  //     {
  //         width:150px;
  //         height:150px
  //     }

  //     .container{
  //         width:75%;
  //         margin:auto;
  //         border:2px solid #282828;
  //     }

  //     /* @media screen and (max-width: 768px)
  //     {
  //         .initialheading
  //     {
  //         display:flex;
  //         flex-direction: column;
  //         justify-content: center;
  //         align-items: center;
  //         background-color: #c85454;
  //         margin-bottom:20px;
  //     }
  //     .doubleheading h1{
  //         font-size: 3.5rem;
  //     }

  //     } */


  //         </style>
  //     </head>

  //     <body>



  //         <div class="container">
  //             <div class="initialheading">
  //                 <div class="img">
  //                     <img src="https://www.icellnitkkr.in/static/media/icell.2f352f17.gif" alt="">
  //                 </div>
  //                 <!-- <div class="doubleheading">
  //                     <div class="backletter">Welcome</div>
  //                     <h1>Welcome</h1>
  //                 </div> -->
  //             </div>
  //             <div class="initial-text">
  //                 <p style="font-size:1.1rem">Hey Contestant,</p>
  //                 <p>
  //                     Thank you for showing interest in TRADE HUNT. <br>
  //                     We hope that you find this experience enjoyable and a informative.<br>
  //                     <b style="font-size: 30px;">Given below is your invitation code.</b>
  //                 </p>
  //             </div>

  //             <div class="button">
  //                 ${otp}
  //             </div>
  //         </div>

  //         <!-- <section id="footer" class="flex-col">
  //             <div class="footer flex-row">
  //                 <div class="footer-info">
  //                     <h1>Industry Cell</h1>
  //                     <p>National Institute of Technology <br>Kurukshetra, India</p>
  //                     <div class="flex-row social-icons-container footer-socialicons"><a
  //                             href="https://www.instagram.com/icell.nitkkr/?hl=en" target="_blank" rel="noreferrer"
  //                             class="social-icon flex-row"><svg stroke="currentColor" fill="currentColor" stroke-width="0"
  //                                 viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
  //                                 <path
  //                                     d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z">
  //                                 </path>
  //                             </svg></a><a
  //                             href="https://www.linkedin.com/company/industry-cell-nit-kurukshetra/?originalSubdomain=in"
  //                             target="_blank" rel="noreferrer" class="social-icon flex-row"><svg stroke="currentColor"
  //                                 fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em"
  //                                 xmlns="http://www.w3.org/2000/svg">
  //                                 <path
  //                                     d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z">
  //                                 </path>
  //                             </svg></a><a href="https://www.facebook.com/industrycell/" target="_blank" rel="noreferrer"
  //                             class="social-icon flex-row"><svg stroke="currentColor" fill="currentColor" stroke-width="0"
  //                                 viewBox="0 0 320 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
  //                                 <path
  //                                     d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z">
  //                                 </path>
  //                             </svg></a><a href="https://discord.gg/SA3tZXDV" target="_blank" rel="noreferrer"
  //                             class="social-icon flex-row"><svg stroke="currentColor" fill="currentColor" stroke-width="0"
  //                                 viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
  //                                 <path
  //                                     d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z">
  //                                 </path>
  //                             </svg></a><a href="https://t.me/joinchat/7XrdpFRXIX84ZDM9" target="_blank" rel="noreferrer"
  //                             class="social-icon flex-row"><svg stroke="currentColor" fill="currentColor" stroke-width="0"
  //                                 viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
  //                                 <path
  //                                     d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z">
  //                                 </path>
  //                             </svg></a></div>
  //                 </div>
  //                 <div class="footer-newsletter flex-col">
  //                     <h4>Our Newsletter</h4>
  //                     <p>Subscribe to our newsletter to get latest updates</p>
  //                     <div class="input-btn-pair flex-row"><input type="text" placeholder="E-mail address">
  //                         <div class="btn">Button</div>
  //                     </div>
  //                     <nav class="minimal-navigation">
  //                         <div class="navlinks--container active">
  //                             <div class="navlink">Home</div>
  //                             <div class="navlink">About Us</div>
  //                             <div class="navlink">Events</div>
  //                             <div class="navlink">Teams</div>
  //                             <div class="navlink">Contact</div>
  //                             <div class="navlink">Blogs</div>
  //                             <div class="navlink">Contributors</div>
  //                         </div>
  //                     </nav>
  //                 </div>
  //             </div>
  //             <p class="copyright">© 2022-2023 All Rights Reserved | Designed by INDUSTRY CELL,
  //                 NIT KURUKSHETRA</p>
  //         </section> -->
  //     </body>
  //     </html>`
  //   };
  //   transporter.sendMail(mailOptions, async function (error, info) {
  //     if (error) {
  //       console.log(error);
  //       return res.json({ "error": "Error occurred" })
  //     } else {
  //       console.log('Email sent: ' + info.response, otp);
  //       const result = await Contest.findOneAndUpdate({ _id: _id }, { $push: { "userTokens": otp } })
  //     }
  //   })
  // }
  res.json({ msg: 'working' })
})


module.exports = router;

// assets_cache = {
//   data: [
//     {
//       symbol, name, daychange, currprice, 24hr,
//     }
//   ],
//   timestamp:
// }

// updateCache() {
//   feth('https://cryptocurrencyliveprices.com/api/').
//   //// {
//   symbol, name, daychange, currprice // convert to inr
//   }
// }

// function updateCache() {
//   fetch('https://cryptocurrencyliveprices.com/api/', {
//     method: 'POST',
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       symbol: coin_symbol,
//       name: coin_name,
//       daychange: coin_percent_change_7d,
//       currprice: coin_price_usd * 70 // convert to inr
//     })
//   })
// }

// function getAllAssets(contestId) {
//   if (!assets_cache.data || timestamp is older than 15 minutes) {
//     await cache.updateChache();

//   }
//   return assets_cache.data;
// }

// function getAssetDetails()

//registerForContest = (inviteCode, contestId) {
// token.mail;
// contestId -> inviteTokens -> $in(token.mail[inviteCode])
// userTokens -> user ka corresponding token
// contest -> particpants -> initialize new participant
// user -> contests -> contest.id push
// }

// getAllContests =() => {
// active & upcoming
// constest start end date
// const userCOntest
//   all contests ->
//   registered: true,
//   participnts -> user.exists
// img, name, organisaer, startTime, endTime, registered
// }
