const express = require("express")
var cors = require("cors")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const authRoutes = require("./routes/authRoutes")
const zoneRoutes = require("./routes/zoneRoutes")
const adminRoutes = require("./routes/adminRoutes")
const cfEclinicRoutes = require("./routes/cfEclinicRoutes")
const cfcpRoutes = require("./routes/cfcpRoutes")
const cpRoutes = require("./routes/cpRoutes")
const telehealthproviderRoute = require("./routes/telehealthproviderRoute")
const drugRoutes = require("./routes/drugRoutes")
const pathologyTestRoute = require("./routes/pathologyLabTestRoutes")
const nphRoutes = require("./routes/nphRoutes")
const ndhRoutes = require("./routes/ndhRoutes")
const eclinicRoutes = require("./routes/eclinicRoutes")
const imageRoutes = require("./routes/imageGetRoute")

dotenv.config()
require("./config/db")

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("something broke!")
})

// Routes setup
app.use("/auth", authRoutes)
app.use("/api", adminRoutes)
app.use("/api", zoneRoutes)
app.use("/api", cfEclinicRoutes)
app.use("/api", cfcpRoutes)
app.use("/api", cpRoutes)
app.use("/api", telehealthproviderRoute)
app.use("/api", drugRoutes)
app.use("/api", pathologyTestRoute)
app.use("/api", nphRoutes)
app.use("/api", ndhRoutes)
app.use("/api", eclinicRoutes)
app.use("/api", imageRoutes)

app.get("/", (req, res) => {
  res.json({ message: "aastha-telehealth-backend-server" })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
