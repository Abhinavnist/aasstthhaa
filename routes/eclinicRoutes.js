const express = require("express")
const router = express.Router()
const {
  createEclinic,
  getEclinicById,
  updateEclinic,
  deleteEclinic,
  getAllEclinics,
} = require("../controllers/eclinicController")

router.post("/eclinic", createEclinic)
router.get("/eclinic/:id", getEclinicById)
router.get("/eclinic", getAllEclinics)
router.put("/eclinic/:id", updateEclinic)
router.delete("/eclinic/:id", deleteEclinic)

module.exports = router
