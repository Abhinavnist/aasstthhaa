const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middleware/authMiddleware")
const {
  addCFCP,
  updateCFCP,
  getCFCPById,
} = require("../controllers/cfcpController")
const { upload } = require("../middleware/multer") // Ensure this is correctly imported

router.post(
  "/add-cfcp",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  addCFCP
)
router.patch("/cfcp/:cfcpId", updateCFCP)
router.get("/cfcp/:cfcpId", getCFCPById)

module.exports = router
