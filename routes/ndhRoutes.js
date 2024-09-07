const express = require("express")
const router = express.Router()
const nphController = require("../controllers/ndhController")

router.post("/ndh", nphController.addNDH)
router.get("/ndh", nphController.getAllNDHs)
router.get("/ndh/:id", nphController.getNDH)
router.put("/ndh/:id", nphController.updateNDH)
// router.delete("/ndh/:id", nphController.deleteNPH)

module.exports = router
