const pool = require("../config/db")
const { addCFEclinicSchema } = require("../validators/validator")
const {
  insertAddress,
  insertProof,
  insertUser,
  hashPassword,
  checkUserExists,
} = require("../services/common")
const generateRandomPassword = require("../utils/randomPassword")

// exports.addCFEclinic = async (req, res) => {
//   const validation = addCFEclinicSchema.safeParse(req.body)

//   if (!validation.success) {
//     return res.status(400).json({ errors: validation.error.errors })
//   }
//   const {
//     firstName,
//     middleName,
//     lastName,
//     gender,
//     dob,
//     email,
//     contact,
//     permanentAddress,
//     presentAddress,
//     idProof,
//     eclinicId,
//   } = req.body

//   console.log(req.body)

//   let connection
//   try {
//     connection = await pool.getConnection()
//     // Check if the user with the given email already exists
//     const existingUser = await checkUserExists(email, connection)

//     if (existingUser.length > 0) {
//       connection.release()
//       return res.status(400).json({ message: "Email already in use" })
//     }
//     // Start transaction
//     await connection.beginTransaction()

//     // Insert permanent address
//     const permanentAddressId = await insertAddress(connection, permanentAddress)

//     // Insert present address
//     const presentAddressId = await insertAddress(connection, presentAddress)
//     const proofId = await insertProof(connection, idProof)

//     // 4. Insert into cf_eclinic
//     const [cfEclinicResult] = await connection.query(
//       "INSERT INTO cf_eclinic (eclinic_id, present_address_id, permanent_address_id) VALUES (?, ?, ?)",
//       [eclinicId, presentAddressId, permanentAddressId]
//     )
//     console.log(cfEclinicResult)
//     const cfEclinicResultId = cfEclinicResult.insertId

//     const [cfEclinic] = await connection.query(
//       "INSERT INTO employee (role_id,first_name, middle_name, last_name, gender, dob, mobile, cf_eclinic, proof_id, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)",
//       [
//         4,
//         firstName,
//         middleName,
//         lastName,
//         gender,
//         dob,
//         contact,
//         cfEclinicResultId,
//         proofId,
//         "path/to/photo.jpg",
//       ]
//     )
//     const cfEclinicId = cfEclinic.insertId

//     const password = await hashPassword(generateRandomPassword(8))
//     await insertUser(connection, {
//       email,
//       password,
//       roleId: 4,
//       refId: cfEclinicId,
//     })

//     await connection.commit()
//     connection.release()

//     res.status(201).json({ message: "CFEclinic created successfully" })
//   } catch (err) {
//     if (connection) {
//       await connection.rollback()
//       connection.release()
//     }
//     console.error("Error:", err)
//     res.status(500).json({ error: err.message })
//   }
// }
exports.addCFEclinic = async (req, res) => {
  // Optionally validate the request body if needed
  // const validation = addCFEclinicSchema.safeParse(req.body);

  // if (!validation.success) {
  //   return res.status(400).json({ errors: validation.error.errors });
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
    eclinicId,
  } = req.body

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
  console.log(req.body)
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

      // Insert into cf_eclinic
      const [cfEclinicResult] = await connection.query(
        "INSERT INTO cf_eclinic (eclinic_id, present_address_id, permanent_address_id) VALUES (?, ?, ?)",
        [eclinicId, presentAddressId, permanentAddressId]
      )
      const cfEclinicResultId = cfEclinicResult.insertId

      // Insert into employee
      const [cfEclinic] = await connection.query(
        "INSERT INTO employee (role_id, first_name, middle_name, last_name, gender, dob, mobile, cf_eclinic, proof_id, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          4,
          firstName,
          middleName,
          lastName,
          gender,
          dob,
          contact,
          cfEclinicResultId,
          proofId,
          photoUrl,
        ]
      )
      const cfEclinicId = cfEclinic.insertId

      const password = await hashPassword(generateRandomPassword(8))
      await insertUser(connection, {
        email,
        password,
        roleId: 4,
        refId: cfEclinicId,
      })

      await connection.commit()
      connection.release()

      res.status(201).json({ message: "CFEclinic created successfully" })
    } catch (err) {
      if (connection) {
        await connection.rollback()
        connection.release()
      }
      console.error("Error:", err)
      res.status(500).json({ error: err.message })
    }
  } catch (err) {
    console.error("Error parsing data:", err)
    res.status(400).json({ error: "Invalid data format" })
  }
}

exports.updateCFEclinic = async (req, res) => {
  const { cfeclinicId } = req.params
  const validation = updateCFEclinicSchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.errors })
  }

  const {
    firstName,
    middleName,
    lastName,
    gender,
    dob,
    contact,
    permanentAddress,
    presentAddress,
    idProof,
  } = validation.data

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [employeeExists] = await connection.query(
      "SELECT id FROM employee WHERE id = ?",
      [cfeclinicId]
    )
    if (employeeExists.length === 0) {
      throw new Error("Employee not found.")
    }

    await updateEmployee(connection, cfeclinicId, {
      firstName,
      middleName,
      lastName,
      gender,
      dob,
      contact,
    })

    if (permanentAddress) {
      const [existingPermanentAddress] = await connection.query(
        "SELECT permanent_address_id FROM cf_eclinic WHERE id = ?",
        [cfeclinicId]
      )
      if (existingPermanentAddress.length > 0) {
        const permanentAddressId =
          existingPermanentAddress[0].permanent_address_id
        await updateAddress(connection, permanentAddressId, permanentAddress)
      }
    }

    if (presentAddress) {
      const [existingPresentAddress] = await connection.query(
        "SELECT present_address_id FROM cf_eclinic WHERE id = ?",
        [cfeclinicId]
      )
      if (existingPresentAddress.length > 0) {
        const presentAddressId = existingPresentAddress[0].present_address_id
        await updateAddress(connection, presentAddressId, presentAddress)
      }
    }

    if (idProof) {
      const [existingProof] = await connection.query(
        "SELECT proof_id FROM employee WHERE id = ?",
        [cfeclinicId]
      )
      if (existingProof.length > 0) {
        const proofId = existingProof[0].proof_id
        await updateProof(connection, proofId, idProof)
      }
    }

    await connection.commit()
    connection.release()

    res.status(200).json({ message: "CFEclinic updated successfully" })
  } catch (err) {
    if (connection) {
      await connection.rollback()
      connection.release()
    }
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  }
}
