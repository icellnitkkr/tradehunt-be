const bcrypt = require("bcryptjs");

const generateToken = require("../utils/generateToken");
const User = require("../models/user");
const { generateUsername } = require("../utils/helpers");

const registerUser = async (req, res) => {
  const { name, email, password, phone, fcm } = req.body;
  console.log(name, email, password, phone, fcm);
  try {
    if (!(email && password && phone && name)) {
      return res.status(400).send({
        success: false,
        message: "Please enter all fields",
      });
    }
    const em = email.toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ email: em }, { phone }],
    });
    if (existingUser) {
      let message = "E-mail already in use";
      if (existingUser.phone === phone) message = "Phone already in use";
      if (existingUser.phone === phone && existingUser.email === email)
        message = "Phone & Email already in use";
      return res.status(400).json({ message });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userSummary = {
      name,
      email: em,
      password: hashedPassword,
      phone,
      fcm,
      profileAvatar:
        "https://res.cloudinary.com/icellnitkkr/image/upload/v1642315024/tradehunt-avatars/goqysorizlopbfpwrmjl.png",

      username: generateUsername(name, phone),
    };
    const user = new User(userSummary);
    await user.save();
    const token = generateToken(user._id);
    return res.status(200).json({
      user: userSummary,
      token,
      message: "New user registered successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong", err });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!(email && password)) {
      res.status(400).send("Missing fields");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser)
      return res.status(404).json({ message: "User doesn't exist" });

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });
    res.status(200).json({
      user: existingUser,
      token: generateToken(existingUser._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.params.userId;

  try {
    if (!(oldPassword && newPassword)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existingUser = await User.findById(userId);
    if (!existingUser)
      return res.status(404).json({ message: "User doesn't exist" });

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      existingUser.password
    );
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    existingUser.password = hashedPassword;
    await existingUser.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const updateAvatar = async (req, res) => {
  const { newAvatar } = req.body;
  const { user } = req;
  try {
    if (!newAvatar) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const existingUser = await User.findById(user.id);
    if (!existingUser)
      return res
        .status(404)
        .json({ success: false, message: "User doesn't exist" });

    existingUser.profileAvatar = newAvatar;
    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      user: existingUser,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

module.exports = { registerUser, loginUser, updatePassword, updateAvatar };
