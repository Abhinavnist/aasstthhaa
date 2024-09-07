// routes/cpRoutes.js
const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middleware/authMiddleware")
const { addCP, getAllCPs, getCPById } = require("../controllers/cpController")
const { upload } = require("../middleware/multer")

// Handle file uploads
router.post("/add-cp", upload.single("photo"), addCP)
router.get("/cps", getAllCPs)
router.get("/cp/:id", getCPById)

module.exports = router
