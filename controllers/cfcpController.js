const pool = require("../config/db")
const { addCFCP_Schema, updateCFCPSchema } = require("../validators/validator")
const {
  insertAddress,
  insertProof,
  insertUser,
  hashPassword,
  checkUserExists,
} = require("../services/common")
const generateRandomPassword = require("../utils/randomPassword")

exports.addCFCP = async (req, res) => {
  // Optionally validate the request body if needed
  // const validation = addCFCP_Schema.safeParse(req.body);
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
    address,
    idProof,
    assignedCPs,
    assignedZones,
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
    documentUrl = `/temppdf/${document.filename}`
  }

  try {
    // Parse JSON fields
    const parsedAddress = JSON.parse(address)
    const parsedIdProof = JSON.parse(idProof)
    const parsedAssignedCPs = JSON.parse(assignedCPs)
    const parsedAssignedZones = JSON.parse(assignedZones)

    // Validate parsed data (You can implement specific validation as needed)
    if (
      !Array.isArray(parsedAssignedCPs) ||
      !Array.isArray(parsedAssignedZones)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid format for assignedCPs or assignedZones" })
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

      // Insert address and proof
      const addressId = await insertAddress(connection, parsedAddress)
      const proofId = await insertProof(connection, {
        ...parsedIdProof,
        document: documentUrl,
      })

      // Insert employee record
      const [cfcpResult] = await connection.query(
        "INSERT INTO employee (role_id, first_name, middle_name, last_name, gender, dob, mobile, address_id, proof_id, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          3,
          firstName,
          middleName,
          lastName,
          gender,
          dob,
          contact,
          addressId,
          proofId,
          photoUrl,
        ]
      )

      const cfcpId = cfcpResult.insertId

      // Insert assigned CPs
      for (const cp of parsedAssignedCPs) {
        await connection.query(
          "INSERT INTO cfcp_assigned_cp (employee_id, assigned_cp) VALUES (?, ?)",
          [cfcpId, cp.id]
        )
      }

      // Insert assigned Zones
      for (const zone of parsedAssignedZones) {
        await connection.query(
          "INSERT INTO cfcp_assigned_zone (employee_id, zone_id) VALUES (?, ?)",
          [cfcpId, zone.id]
        )
      }

      // Insert user
      const password = await hashPassword(generateRandomPassword(8))
      await insertUser(connection, {
        email,
        password,
        roleId: 3,
        refId: cfcpId,
      })

      await connection.commit()
      connection.release()

      res.status(201).json({ message: "CF_CP created successfully" })
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

// exports.updateCFCP = async (req, res) => {
//   const { cfcpId } = req.params // Assuming cfcpId is passed as a URL parameter
//   const validation = updateCFCPSchema.safeParse(req.body)

//   if (!validation.success) {
//     return res.status(400).json({ errors: validation.error.errors })
//   }

//   const {
//     firstName,
//     middleName,
//     lastName,
//     gender,
//     dob,
//     contact,
//     address,
//     idProof,
//     assignedCPs,
//     assignedZones,
//   } = validation.data

//   let connection
//   try {
//     connection = await pool.getConnection()

//     // Start transaction
//     await connection.beginTransaction()

//     // Update only the fields provided in the request body
//     if (firstName || middleName || lastName || gender || dob || contact) {
//       await connection.query(
//         "UPDATE employee SET first_name = COALESCE(?, first_name), middle_name = COALESCE(?, middle_name), last_name = COALESCE(?, last_name), gender = COALESCE(?, gender), dob = COALESCE(?, dob), mobile = COALESCE(?, mobile) WHERE id = ?",
//         [firstName, middleName, lastName, gender, dob, contact, cfcpId]
//       )
//     }

//     if (address) {
//       const [existingAddress] = await connection.query(
//         "SELECT address_id FROM employee WHERE id = ?",
//         [cfcpId]
//       )

//       if (existingAddress.length > 0) {
//         const addressId = existingAddress[0].address_id
//         console.log(addressId)
//         await connection.query(
//           "UPDATE address SET address_line1 = COALESCE(?, address_line1), address_line2 = COALESCE(?, address_line2), city_block = COALESCE(?, city_block), district = COALESCE(?, district), state = COALESCE(?, state), zipcode = COALESCE(?, zipcode) WHERE id = ?",
//           [
//             address.address_line1,
//             address.address_line2,
//             address.city_block,
//             address.district,
//             address.state,
//             address.zipcode,
//             addressId,
//           ]
//         )
//       }
//     }

//     if (idProof) {
//       const [existingProof] = await connection.query(
//         "SELECT proof_id FROM employee WHERE id = ?",
//         [cfcpId]
//       )

//       if (existingProof.length > 0) {
//         const proofId = existingProof[0].proof_id
//         await connection.query(
//           "UPDATE id_proof SET type = COALESCE(?, type), number = COALESCE(?, number) WHERE id = ?",
//           [idProof.type, idProof.number, proofId]
//         )
//       }
//     }

//     if (assignedCPs) {
//       await connection.query(
//         "DELETE FROM cfcp_assigned_cp WHERE employee_id = ?",
//         [cfcpId]
//       )
//       for (const cp of assignedCPs) {
//         await connection.query(
//           "INSERT INTO cfcp_assigned_cp (employee_id, assigned_cp) VALUES (?, ?)",
//           [cfcpId, cp.id]
//         )
//       }
//     }

//     if (assignedZones) {
//       await connection.query(
//         "DELETE FROM cfcp_assigned_zone WHERE employee_id = ?",
//         [cfcpId]
//       )
//       for (const zone of assignedZones) {
//         await connection.query(
//           "INSERT INTO cfcp_assigned_zone (employee_id, zone_id) VALUES (?, ?)",
//           [cfcpId, zone.id]
//         )
//       }
//     }

//     await connection.commit()
//     connection.release()

//     res.status(200).json({ message: "CFCP updated successfully" })
//   } catch (err) {
//     if (connection) {
//       await connection.rollback()
//       connection.release()
//     }
//     console.error("Error:", err)
//     res.status(500).json({ error: err.message })
//   }
// }
exports.updateCFCP = async (req, res) => {
  const { cfcpId } = req.params
  const validation = updateCFCPSchema.safeParse(req.body)

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
    address,
    idProof,
    assignedCPs,
    assignedZones,
  } = validation.data

  console.log("Validated Data:", validation.data)

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    // Check if employee exists
    const [employeeExists] = await connection.query(
      "SELECT id FROM employee WHERE id = ?",
      [cfcpId]
    )

    if (employeeExists.length === 0) {
      throw new Error("Employee not found.")
    }

    console.log(req.body.address)

    if (firstName || middleName || lastName || gender || dob || contact) {
      console.log("Updating employee...")
      await connection.query(
        "UPDATE employee SET first_name = COALESCE(?, first_name), middle_name = COALESCE(?, middle_name), last_name = COALESCE(?, last_name), gender = COALESCE(?, gender), dob = COALESCE(?, dob), mobile = COALESCE(?, mobile) WHERE id = ?",
        [firstName, middleName, lastName, gender, dob, contact, cfcpId]
      )
    }

    if (address) {
      const [existingAddress] = await connection.query(
        "SELECT address_id FROM employee WHERE id = ?",
        [cfcpId]
      )
      console.log("Existing Address:", existingAddress)

      if (existingAddress.length > 0) {
        const addressId = existingAddress[0].address_id
        console.log("Updating address with ID:", addressId)
        const { line1, line2, city, district, state, zipcode } =
          req.body.address

        const addressData = {
          address_line1: line1,
          address_line2: line2,
          city_block: city,
          district: district,
          state: state,
          zipcode: zipcode,
        }
        await connection.query(
          "UPDATE address SET address_line1 = COALESCE(?, address_line1), address_line2 = COALESCE(?, address_line2), city_block = COALESCE(?, city_block), district = COALESCE(?, district), state = COALESCE(?, state), zipcode = COALESCE(?, zipcode) WHERE id = ?",
          [
            addressData.address_line1,
            addressData.address_line2,
            addressData.city_block,
            addressData.district,
            addressData.state,
            addressData.zipcode,
            addressId,
          ]
        )
        console.log("Address updated successfully.")
      }
    }

    if (idProof) {
      const [existingProof] = await connection.query(
        "SELECT proof_id FROM employee WHERE id = ?",
        [cfcpId]
      )
      console.log("Existing Proof:", existingProof)

      if (existingProof.length > 0) {
        const proofId = existingProof[0].proof_id
        console.log("Updating ID proof with ID:", proofId)
        await connection.query(
          "UPDATE id_proof SET proof_type = COALESCE(?, proof_type), proof_no = COALESCE(?, proof_no), proof = COALESCE(?, proof) WHERE id = ?",
          [idProof.type, idProof.number, idProof.document, proofId] // Added `proofId` at the end
        )
      }
    }

    if (assignedCPs) {
      console.log("Updating assigned CPs...")
      await connection.query(
        "DELETE FROM cfcp_assigned_cp WHERE employee_id = ?",
        [cfcpId]
      )
      for (const cp of assignedCPs) {
        await connection.query(
          "INSERT INTO cfcp_assigned_cp (employee_id, assigned_cp) VALUES (?, ?)",
          [cfcpId, cp.id]
        )
      }
    }

    if (assignedZones) {
      console.log("Updating assigned Zones...")
      await connection.query(
        "DELETE FROM cfcp_assigned_zone WHERE employee_id = ?",
        [cfcpId]
      )
      for (const zone of assignedZones) {
        await connection.query(
          "INSERT INTO cfcp_assigned_zone (employee_id, zone_id) VALUES (?, ?)",
          [cfcpId, zone.id]
        )
      }
    }

    await connection.commit()
    connection.release()

    res.status(200).json({ message: "CFCP updated successfully" })
  } catch (err) {
    if (connection) {
      await connection.rollback()
      connection.release()
    }
    console.error("Error:", err)
    res.status(500).json({ error: err.message })
  }
}

exports.getCFCPById = async (req, res) => {
  const { cfcpId } = req.params
  let connection
  try {
    connection = await pool.getConnection()

    const [cfcp] = await connection.query(
      `SELECT 
          e.id,
          e.first_name,
          e.middle_name,
          e.last_name,
          e.gender,
          e.dob,
          e.mobile AS contact,
          e.photo,
          JSON_OBJECT(
            'address_line1', a.address_line1,
            'address_line2', a.address_line2,
            'city_block', a.city_block,
            'district', a.district,
            'state', a.state,
            'zipcode', a.zipcode
          ) AS address,
          JSON_OBJECT(
            'proof_type', p.proof_type,
            'proof_no', p.proof_no,
            'proof', p.proof
          ) AS idProof,
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('id', cp.assigned_cp))
            FROM cfcp_assigned_cp cp WHERE cp.employee_id = e.id
          ) AS assignedCPs,
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('id', z.zone_id))
            FROM cfcp_assigned_zone z WHERE z.employee_id = e.id
          ) AS assignedZones
        FROM employee e
        JOIN address a ON e.address_id = a.id
        JOIN id_proof p ON e.proof_id = p.id
        WHERE e.id = ? AND e.role_id = 3`,
      [cfcpId]
    )

    if (cfcp.length === 0) {
      return res.status(404).json({ message: "CFCP not found" })
    }

    res.status(200).json(cfcp[0])
  } catch (err) {
    console.error("Error fetching CFCP:", err)
    res.status(500).json({ error: err.message })
  } finally {
    if (connection) connection.release()
  }
}
