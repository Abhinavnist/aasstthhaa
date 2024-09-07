const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middleware/authMiddleware")
const { addCFEclinic } = require("../controllers/cfEclinicController")
const { upload } = require("../middleware/multer")
router.post(
  "/add-cfeclinic",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  addCFEclinic
)

module.exports = router
