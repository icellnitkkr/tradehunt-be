const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

//routes
const userRouter = require("./routes/userRoutes");
const contestRouter = require("./routes/contests");
const adminRouter = require("./routes/admin");
const notifs = require("./routes/notifs");

//middlewares
const auth = require("./middleware/auth");
const admin = require("./middleware/admin");
const port = 3000;
dotenv.config();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("connected to db"))
  .catch((err) =>
    console.log("unable to conect to db because of error: ", err)
  );
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Trade Hunt");
});

app.use("/user", userRouter);
app.use("/contests", auth, contestRouter);
app.use("/news", notifs);
app.use("/admin", adminRouter);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Tradehunt Backend is running at http://localhost:${port}`);
});
