const express = require("express")
const router = express.Router()
const drugDetailController = require("../controllers/drugController")

router.post("/drug-details", drugDetailController.addDrugDetail)
router.put("/drug-details/:id", drugDetailController.updateDrugDetail)
router.delete("/drug-details/:id", drugDetailController.deleteDrugDetail)
router.get("/drug-details", drugDetailController.getAllDrugDetails)
router.get("/drug-details/:id", drugDetailController.getDrugDetailById)

module.exports = router
