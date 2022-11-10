const router = require("express").Router();
const UserController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/register", UserController.registerUser);
router.post("/login", UserController.loginUser);
router.post("/:userId/updatePassword", UserController.updatePassword);
router.post("/updateAvatar", auth, UserController.updateAvatar);

module.exports = router;
