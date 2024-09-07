const express = require("express")
const router = express.Router()
const pathologyTestController = require("../controllers/pathologyLabTest")

router.post("/pathology-tests", pathologyTestController.addPathologyTest)
router.get("/pathology-tests", pathologyTestController.getAllPathologyTests)
router.get("/pathology-tests/:id", pathologyTestController.getPathologyTestById)
router.put("/pathology-tests/:id", pathologyTestController.updatePathologyTest)
router.delete(
  "/pathology-tests/:id",
  pathologyTestController.deletePathologyTest
)

module.exports = router
