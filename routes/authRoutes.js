const router = require("express").Router();
const { register, login, updatePlan } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.put("/upgrade-plan", auth, updatePlan);

module.exports = router;