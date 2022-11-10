const router = require("express").Router();
const news = require("../models/notif");

//get all notifs
router.get("/", async (req, res) => {
	try {
		const News = await news.find().sort({ createdAt: -1 });
		res.status(200).send(News);
	} catch (err) {
		res.status(500).json(err);
	}
});

//-------admin
//add notif
router.post("/add", async (req, res) => {
	try {
		let latestEntry = {
			img: req.body.img,
			link: req.body.link,
		};

		if (!latestEntry.img || !latestEntry.link) {
			return res.status(400).json({ message: "Missing required fields" });
		}
		const latestNews = new news(latestEntry);
		await news.create(latestNews);

		res.status(200).json({ message: "Latest entry added Successfully" });
	} catch (err) {
		res.status(500).json({
			error: err,
			message: "Internal Server Error",
		});
	}
});

//delete notif
router.delete("/:notifId", async (req, res) => {
	try {
		await news.deleteOne({ _id: req.params.notifId });
		
		res.json({ message: "News deleted successfully" });
		res.status(200).send();
	} catch {
		res.status(404).send({ error: "News doesn't exist!" });
	}
});

//update notif
router.post("/:notifId", async (req, res) => {
	try {
		const upNews = await news.findOne({ _id: req.params.notifId });
		if (req.body.img) {
			upNews.img = req.body.img;
		}
		if (req.body.link) {
			upNews.link = req.body.link;
		}
		await upNews.save();
		res.status(200).send(upNews);
	} catch {
		res.status(404).send({ error: "News doesn't exist!" });
	}
});

module.exports = router;
