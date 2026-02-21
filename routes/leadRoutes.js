const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { createLeads, downloadExcel } = require("../controllers/leadController");

router.post("/generate", auth, createLeads);
router.get("/download/excel/:id", auth, downloadExcel);

module.exports = router;
