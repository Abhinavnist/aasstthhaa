const express = require("express")
const { login, getUserData } = require("../controllers/authController")

const { verifyToken } = require("../middleware/authMiddleware")

const router = express.Router()
router.post("/login", login)

router.get("/user/data", verifyToken, getUserData)

module.exports = router
