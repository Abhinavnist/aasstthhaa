const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middleware/authMiddleware")
const {
  addTelehealthProvider,
} = require("../controllers/telehealthproviderController")
const { upload } = require("../middleware/multer")

router.post(
  "/add-telehealth",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  addTelehealthProvider
)

module.exports = router
