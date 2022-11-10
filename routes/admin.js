const router = require("express").Router();
const Contest = require("../models/contest");
const nodemailer = require('nodemailer');

router.post("/sendEmailsAndAddUserToken", (req, res) => {
    const { contestId, users } = req.body;
    try {
        Contest.findById(contestId).then(contest => {
            if (!contest) {
                return res.status(404).send("Contest not found");
            }
            var userTokens = contest.userTokens
            var result = users.map(user => {
                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    requireTLS: true,
                    auth: {
                        user: 'icell@nitkkr.ac.in',
                        pass: process.env.MAIL_PWD
                    }
                });

                var inviteCode = Math.random().toString(36).slice(2).substring(0, 6)

                while (userTokens.find(ele => ele == inviteCode))
                    inviteCode = Math.random().toString(36).slice(2).substring(0, 6)

                let mailOptions = {
                    from: '"Industry Cell NIT Kurukshetra" <icell@nitkkr.ac.in>',
                    to: user,
                    subject: 'Test',
                    html: `<h1>invite code = ${inviteCode}</h1>`
                };

                return transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return { email: user, status: 'failed' }
                    } else {
                        Contest.findOneAndUpdate({ _id: contestId }, { $push: { userTokens: inviteCode } }, { new: true }).then(contest => {
                            userTokens.push(inviteCode)
                        })
                    }
                });
            })
            res.status(200).json(result);
        })
    } catch (e) {
        res.status(500).json(e);
    }
})


module.exports = router;