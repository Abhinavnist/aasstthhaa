const pool = require("../config/db")
const { addTelehealthProviderSchema } = require("../validators/validator")
const {
  insertAddress,
  insertProof,
  insertUser,
  hashPassword,
  checkUserExists,
} = require("../services/common")
const generateRandomPassword = require("../utils/randomPassword")

exports.addTelehealthProvider = async (req, res) => {
  // const validation = addTelehealthProviderSchema.safeParse(req.body)

  // if (!validation.success) {
  //   return res.status(400).json({ errors: validation.error.errors.path })
  // }
  const {
    firstName,
    middleName,
    lastName,
    gender,
    dob,
    email,
    contact,
    permanentAddress,
    presentAddress,
    idProof,
    zone,
  } = req.body

  console.log(req.body)

  // Extract the uploaded files
  const photo = req.files?.photo ? req.files.photo[0] : null
  const document = req.files?.document ? req.files.document[0] : null

  // Generate URLs for the uploaded files
  let photoUrl = null
  let documentUrl = null

  if (photo) {
    photoUrl = `/temp/${photo.filename}`
  }

  if (document) {
    documentUrl = `/temp/${document.filename}`
  }

  let connection
  try {
    // Ensure the required fields are provided
    if (!permanentAddress || !presentAddress || !idProof) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Parse JSON fields
    const parsedPermanentAddress = JSON.parse(permanentAddress)
    const parsedPresentAddress = JSON.parse(presentAddress)
    const parsedIdProof = JSON.parse(idProof)

    // Validate parsed data
    if (!parsedPermanentAddress || !parsedPresentAddress || !parsedIdProof) {
      return res
        .status(400)
        .json({ message: "Invalid format for address or idProof" })
    }

    // Update parsedIdProof with document URL
    parsedIdProof.document = documentUrl || parsedIdProof.document // Use the uploaded document URL if available
    connection = await pool.getConnection()
    // Check if the user with the given email already exists
    const existingUser = await checkUserExists(email, connection)

    if (existingUser.length > 0) {
      connection.release()
      return res.status(400).json({ message: "Email already in use" })
    }
    // Start transaction
    await connection.beginTransaction()

    // Insert addresses and proof
    const permanentAddressId = await insertAddress(
      connection,
      parsedPermanentAddress
    )
    const presentAddressId = await insertAddress(
      connection,
      parsedPresentAddress
    )
    const proofId = await insertProof(connection, parsedIdProof)

    // 4. Insert into tele_health_provider
    const [telehealthpProviderResult] = await connection.query(
      "INSERT INTO tele_health_provider (zone_id, present_address_id, permanent_address_id) VALUES (?, ?, ?)",
      [zone, presentAddressId, permanentAddressId]
    )
    const telehealthpProviderResultId = telehealthpProviderResult.insertId

    const [teleHealthProvider] = await connection.query(
      "INSERT INTO employee (role_id,first_name, middle_name, last_name, gender, dob, mobile, tele_health_provider, proof_id, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)",
      [
        5,
        firstName,
        middleName,
        lastName,
        gender,
        dob,
        contact,
        telehealthpProviderResultId,
        proofId,
        "path/to/photo.jpg",
      ]
    )
    const teleHealthProviderId = teleHealthProvider.insertId

    const password = await hashPassword(generateRandomPassword(8))
    await insertUser(connection, {
      email,
      password,
      roleId: 5,
      refId: teleHealthProviderId,
    })

    await connection.commit()
    connection.release()

    res
      .status(201)
      .json({ message: "teleHealthProviderId created successfully" })
  } catch (err) {
    if (connection) {
      await connection.rollback()
      connection.release()
    }
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  }
}
