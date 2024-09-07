const express = require("express")
const router = express.Router()
const nphController = require("../controllers/nphController")

router.post("/nph", nphController.addNPH)
router.get("/nph", nphController.getAllNPH)
router.get("/nph/:id", nphController.getNPHById)
router.put("/nph/:id", nphController.updateNPH)
router.delete("/nph/:id", nphController.deleteNPH)

module.exports = router
