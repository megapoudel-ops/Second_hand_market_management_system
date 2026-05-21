const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.get("/profile", auth, authController.profile);
router.post("/logout", authController.logout);

module.exports = router;

