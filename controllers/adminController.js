const pool = require("../config/db")
const { addAdminSchema } = require("../validators/validator")
const {
  insertAddress,
  insertProof,
  insertUser,
  hashPassword,
  checkUserExists,
} = require("../services/common")
const generateRandomPassword = require("../utils/randomPassword")

exports.addAdmin = async (req, res) => {
  const validation = addAdminSchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors })
  }
  const {
    firstName,
    middleName,
    lastName,
    gender,
    dob,
    email,
    contact,
    address,
    idProof,
  } = req.body

  console.log(req.body)

  let connection
  try {
    connection = await pool.getConnection()
    // Check if the user with the given email already exists
    const existingUser = await checkUserExists(email, connection)

    if (existingUser.length > 0) {
      connection.release()
      return res.status(400).json({ message: "Email already in use" })
    }
    // Start transaction
    await connection.beginTransaction()

    const addressId = await insertAddress(connection, address)
    const proofId = await insertProof(connection, idProof)

    const [adminResult] = await connection.query(
      "INSERT INTO employee (first_name, middle_name, last_name, gender, dob, mobile, address_id, proof_id, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        firstName,
        middleName,
        lastName,
        gender,
        dob,
        contact,
        addressId,
        proofId,
        "path/to/photo.jpg",
      ]
    )
    const adminId = adminResult.insertId

    const password = await hashPassword(generateRandomPassword(8))
    await insertUser(connection, { email, password, roleId: 1, refId: adminId })

    await connection.commit()
    connection.release()

    res.status(201).json({ message: "Admin created successfully" })
  } catch (err) {
    if (connection) {
      await connection.rollback()
      connection.release()
    }
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  }
}
