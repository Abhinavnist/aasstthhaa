const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the destination directory based on file type
    let uploadPath = path.join(__dirname, "../public/temp")

    if (file.mimetype === "application/pdf") {
      uploadPath = path.join(__dirname, "../public/temppdf")
    }

    // Ensure the directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },
  filename: function (req, file, cb) {
    // Generate a unique suffix for the file name to prevent collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

// Create the multer upload instance with the defined storage configuration
const upload = multer({ storage })

// Export the upload instance
module.exports = { upload }
