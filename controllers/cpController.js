const pool = require("../config/db")
const { addCP_Schema } = require("../validators/validator")
const {
  insertAddress,
  insertProof,
  insertUser,
  hashPassword,
  checkUserExists,
} = require("../services/common")
const generateRandomPassword = require("../utils/randomPassword")

exports.addCP = async (req, res) => {
  // // Validate request data
  // const validation = addCP_Schema.safeParse(req.body)
  // console.log(req.body)
  // if (!validation.success) {
  //   return res.status(400).json({ errors: validation.error.issues })
  // }
  const {
    firstName,
    middleName,
    lastName,
    gender,
    dob,
    email,
    personalMobile,
    consultationMobile,
    address,
    proof,
    category,
    degree,
    specialty,
    subSpecialty,
    superSpecialty,
    fellowship,
  } = req.body
  const photo = req.file
  if (
    !firstName ||
    !lastName ||
    !email ||
    !personalMobile ||
    !address ||
    !proof ||
    !category
  ) {
    return res.status(400).json({ message: "Please fill all required fields" })
  }

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
    const parseAddress = JSON.parse(address)
    const parseProof = JSON.parse(proof)
    console.log(parseAddress, parseProof)

    const addressId = await insertAddress(connection, parseAddress)
    const proofId = await insertProof(connection, parseProof)
    // Handle the photo file

    // Generate photo URL
    let photoUrl = null
    if (photo) {
      photoUrl = `/temp/${photo.filename}` // URL to access the file
    }

    const [cpResult] = await connection.query(
      "INSERT INTO cp (first_name, middle_name, last_name, gender, dob, personal_mobile, consultation_mobile, address_id, proof_id, is_locked, photo, category_id, reg_no, degree, specialty, sub_specialty, super_specialty, fellowship, cf_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        firstName,
        middleName,
        lastName,
        gender,
        dob,
        personalMobile,
        consultationMobile,
        addressId,
        proofId,
        false,
        photoUrl,
        category,
        "REG123",
        degree,
        specialty,
        subSpecialty,
        superSpecialty,
        fellowship,
        true,
      ]
    )
    const cpId = cpResult.insertId

    const password = await hashPassword(generateRandomPassword(8))
    await insertUser(connection, { email, password, roleId: 2, refId: cpId })

    await connection.commit()
    connection.release()

    res.status(201).json({ message: "CP created successfully" })
  } catch (err) {
    if (connection) {
      await connection.rollback()
      connection.release()
    }
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  }
}

exports.getAllCPs = async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()

    const [results] = await connection.query(
      `SELECT cp.*, users.email, address.*, id_proof.*
         FROM cp
         JOIN users ON users.ref_id = cp.id
         JOIN address ON address.id = cp.address_id
         JOIN id_proof ON id_proof.id = cp.proof_id`
    )

    connection.release()
    res.status(200).json(results)
  } catch (err) {
    if (connection) connection.release()
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  }
}

exports.getCPById = async (req, res) => {
  const { id } = req.params

  let connection
  try {
    connection = await pool.getConnection()

    const [results] = await connection.query(
      `SELECT cp.*, users.email, address.*, id_proof.*
         FROM cp
         JOIN users ON users.ref_id = cp.id
         JOIN address ON address.id = cp.address_id
         JOIN id_proof ON id_proof.id = cp.proof_id
         WHERE cp.id = ?`,
      [id]
    )

    connection.release()

    if (results.length === 0) {
      return res.status(404).json({ message: "CP not found" })
    }

    res.status(200).json(results[0])
  } catch (err) {
    if (connection) connection.release()
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  }
}
