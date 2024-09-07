const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middleware/authMiddleware")
const { addAdmin } = require("../controllers/adminController")

router.post("/add-admin", addAdmin)

module.exports = router
