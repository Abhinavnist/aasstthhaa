const express = require("express")
const path = require("path")
const router = express.Router()

// Define the route to serve the image
router.get("/image/:filename", (req, res) => {
  const { filename } = req.params

  // Construct the file path
  const filePath = path.join(__dirname, "../public/temp", filename)

  // Send the file
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(err.status).end()
    }
  })
})

module.exports = router
