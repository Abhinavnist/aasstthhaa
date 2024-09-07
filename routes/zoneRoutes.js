const express = require("express")
const router = express.Router()
const { verifyToken } = require("../middleware/authMiddleware")
const zoneController = require("../controllers/zoneController")

router.post("/zones", zoneController.addZone)
router.get("/zones", zoneController.getAllZones)
router.get("/zones/:id", zoneController.getZoneById)
router.get("/states", zoneController.getAllStates)
router.post("/state", zoneController.addState)

module.exports = router
